import ServiceRequest from "../modal/Service.js";
import Partner from "../modal/Partner.js";
import Notification from "../modal/Notification.js";
import Wallet from "../modal/Wallet.js";
import User from "../modal/User.js";
import { sendOTP } from "../utils/email.js";
import { calculateTotal } from "../utils/pricingConfig.js";
import { notifyUser, notifyMany } from "../socket.js";

/* =======================
   Distance Helper
======================= */
const getDistanceInKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return +distance.toFixed(2);
};

/* =======================
   Wallet Credit Helper
======================= */
const creditWallet = async (userId, role, amount, description, serviceRequestId) => {
  try {
    let wallet = await Wallet.findOne({ owner: userId });
    if (!wallet) {
      wallet = await Wallet.create({ owner: userId, role, balance: 0, transactions: [] });
    }
    wallet.balance += amount;
    wallet.transactions.push({ amount, type: "credit", description, serviceRequestId });
    await wallet.save();
  } catch (err) {
    console.error("WALLET CREDIT ERROR:", err);
  }
};

/* =======================
   CREATE SERVICE REQUEST (Customer)
======================= */
export const createServiceRequest = async (req, res) => {
  try {
    let { serviceType, problemDescription, location } = req.body;
    serviceType = serviceType?.trim().toLowerCase();

    if (!serviceType || !problemDescription || !location?.lat || !location?.lng) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // DUPLICATE CHECK: Prevent same request within 5 minutes — only block if NOT expired
    const existing = await ServiceRequest.findOne({
      customerId: req.userId,
      serviceType,
      problemDescription,
      status: "open",
      expiresAt: { $gt: new Date() }, // still within expiry window
      createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) }
    });

    if (existing) {
      return res.status(400).json({ message: "You already have a similar active request. Please wait or cancel it." });
    }

    const service = await ServiceRequest.create({
      customerId: req.userId,
      serviceType,
      problemDescription,
      location,
      status: "open",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Find nearby partners matching profession
    const partners = await Partner.find({
      isAvailable: true,
      status: "approved",
      profession: { $regex: `^${serviceType}$`, $options: "i" },
      location: { $exists: true },
    });

    const nearbyPartners = partners.filter((p) => {
      if (!p.location?.lat || !p.location?.lng) return false;
      const distance = getDistanceInKm(p.location.lat, p.location.lng, location.lat, location.lng);
      return distance <= 25; // Broadcast to partners within 25km
    });

    // Save DB notifications
    await Notification.insertMany(
      nearbyPartners.map((p) => ({
        user: p.user,
        message: `New ${serviceType} service request near your location`,
        type: "service_request",
        relatedId: service._id,
        status: "unread",
      }))
    );

    // Push real-time WebSocket notifications to all nearby partners
    nearbyPartners.forEach((p) => {
      notifyUser(p.user.toString(), {
        type: "new_request",
        message: `New ${serviceType} request near you!`,
        data: {
          requestId: service._id,
          serviceType,
          problemDescription,
          location,
        },
      });
    });

    res.status(201).json({
      message: "Service request broadcasted successfully",
      service,
      notifiedPartners: nearbyPartners.length,
    });
  } catch (error) {
    console.error("CREATE SERVICE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   CANCEL SERVICE REQUEST (Customer)
   Only allowed for open or assigned (not in_progress+)
======================= */
export const cancelServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await ServiceRequest.findOne({
      _id: requestId,
      customerId: req.userId,
    }).populate("assignedPartner");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (!["open", "assigned"].includes(request.status)) {
      return res.status(400).json({
        message: "Cannot cancel — work has already started (OTP verified). Contact support.",
      });
    }

    request.status = "cancelled";
    await request.save();

    // Close any related notifications
    await Notification.updateMany({ relatedId: requestId }, { status: "closed" });

    // If a vendor was assigned, notify them
    if (request.assignedPartner) {
      const partner = request.assignedPartner;
      notifyUser(partner.user?.toString(), {
        type: "request_cancelled",
        message: `Customer cancelled the ${request.serviceType} request.`,
        data: { requestId: request._id },
      });

      await Notification.create({
        user: partner.user,
        message: `Customer cancelled the ${request.serviceType} request.`,
        type: "status_update",
      });
    }

    res.json({ message: "Request cancelled successfully" });
  } catch (err) {
    console.error("CANCEL REQUEST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   GET NEARBY REQUESTS (Provider)
======================= */
export const getNearbyRequests = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.userId });
    if (!partner || partner.status !== "approved" || !partner.location?.lat || !partner.location?.lng) {
      return res.status(400).json({ message: "Partner not approved or location missing" });
    }

    const profession = partner.profession?.trim().toLowerCase();
    const now = new Date();

    const requests = await ServiceRequest.find({
      $or: [
        {
          status: "open",
          serviceType: { $regex: `^${profession}$`, $options: "i" },
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: now } }
          ]
        },
        {
          assignedPartner: partner._id,
          status: { $in: ["assigned", "in_progress"] }
        }
      ]
    }).sort({ createdAt: -1 });

    const RADIUS_STEPS = [2, 5, 10, 25];
    let nearbyRequests = [];
    let usedRadius = null;

    for (const radius of RADIUS_STEPS) {
      nearbyRequests = requests.filter(r => {
        if (!r.location?.lat || !r.location?.lng) return false;
        const distance = getDistanceInKm(
          partner.location.lat, partner.location.lng,
          r.location.lat, r.location.lng
        );
        return distance <= radius;
      });
      if (nearbyRequests.length > 0) { usedRadius = radius; break; }
    }

    const uniqueRequests = Array.from(new Map(nearbyRequests.map(r => [r._id.toString(), r])).values());

    res.json({ radiusUsedInKm: usedRadius, count: uniqueRequests.length, requests: uniqueRequests });
  } catch (err) {
    console.error("GET NEARBY REQUEST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   ACCEPT REQUEST (Provider)
======================= */
export const acceptServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const partner = await Partner.findOne({ user: req.userId });
    if (!partner) return res.status(400).json({ message: "Partner not available" });

    const request = await ServiceRequest.findById(requestId);
    if (!request || request.status !== "open") {
      return res.status(400).json({ message: "Request not available" });
    }

    if (new Date() > request.expiresAt) {
      return res.status(400).json({ message: "Request expired" });
    }

    if (request.serviceType.trim().toLowerCase() !== partner.profession.trim().toLowerCase()) {
      return res.status(403).json({ message: "Request not allowed for your profession" });
    }

    const distance = getDistanceInKm(
      partner.location.lat, partner.location.lng,
      request.location.lat, request.location.lng
    );
    if (distance > 25) return res.status(403).json({ message: "Request too far" });

    // Atomic assign
    const assigned = await ServiceRequest.findOneAndUpdate(
      { _id: requestId, status: "open" },
      { status: "assigned", assignedPartner: partner._id },
      { new: true }
    )
    .populate("assignedPartner", "fullName phone profession workType")
    .populate("customerId", "email name");

    if (!assigned) return res.status(400).json({ message: "Request already taken" });

    // Close partner-side notifications
    await Notification.updateMany({ relatedId: requestId }, { status: "closed" });

    // Notify customer via WS — real time push
    notifyUser(assigned.customerId._id.toString(), {
      type: "request_accepted",
      message: `✅ Your ${assigned.serviceType} request was accepted! ${assigned.assignedPartner?.fullName} is on the way.`,
      data: {
        requestId: assigned._id,
        providerName: assigned.assignedPartner?.fullName,
        providerPhone: assigned.assignedPartner?.phone,
      },
    });

    // Save DB notification for customer
    await Notification.create({
      user: assigned.customerId._id,
      type: "status_update",
      message: `Your service request has been accepted. ${assigned.assignedPartner?.fullName} is assigned.`,
    });

    res.json({ message: "Service assigned successfully", request: assigned });
  } catch (error) {
    console.error("ACCEPT REQUEST ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   REJECT REQUEST (Provider)
   Keeps request OPEN for other vendors — just removes from this vendor's view
======================= */
export const rejectServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const partner = await Partner.findOne({ user: req.userId });
    if (!partner) return res.status(403).json({ message: "Partner not found" });

    const request = await ServiceRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Don't change global status — just acknowledge the rejection from this vendor
    // The request stays `open` for other vendors
    res.json({ success: true, message: "Request skipped" });
  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
};

/* =======================
   SEND OTP TO CUSTOMER (Provider)
======================= */
export const sendOTPToCustomer = async (req, res) => {
  try {
    const { requestId } = req.body;

    const partner = await Partner.findOne({ user: req.userId });
    if (!partner) return res.status(403).json({ message: "Not authorized" });

    const request = await ServiceRequest.findOne({
      _id: requestId,
      assignedPartner: partner._id,
      status: "assigned",
    }).populate("customerId", "email name");

    if (!request) return res.status(400).json({ message: "Request not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    request.otp = otp;
    await request.save();

    if (request.customerId?.email) {
      await sendOTP(request.customerId.email, otp, request.serviceType);
    }

    // WS notify customer that OTP is incoming
    notifyUser(request.customerId._id.toString(), {
      type: "otp_sent",
      message: `🔐 An OTP has been sent to your email for ${request.serviceType} service. Share it with your provider to start.`,
      data: { requestId: request._id },
    });

    res.json({ message: "OTP sent to customer's registered email successfully!" });
  } catch (err) {
    console.error("SEND OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   VERIFY OTP & START TIMER (Provider)
======================= */
export const verifyOTPAndStart = async (req, res) => {
  try {
    const { requestId, otp } = req.body;

    const partner = await Partner.findOne({ user: req.userId });
    if (!partner) return res.status(403).json({ message: "Not authorized" });

    const request = await ServiceRequest.findOne({
      _id: requestId,
      assignedPartner: partner._id,
      status: "assigned",
    }).populate("customerId", "_id name");

    if (!request) return res.status(400).json({ message: "Request not found or already started" });

    if (request.otp?.toString().trim() !== otp?.toString().trim()) {
      return res.status(400).json({ message: "Invalid OTP. Please check with customer." });
    }

    request.status = "in_progress";
    request.startTime = new Date();
    await request.save();

    // WS notify customer that work has started
    notifyUser(request.customerId._id.toString(), {
      type: "service_started",
      message: `⏱️ Your ${request.serviceType} service has started! Timer is running.`,
      data: { requestId: request._id, startTime: request.startTime },
    });

    res.json({ message: "OTP Verified! Timer started.", request });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   COMPLETE SERVICE (Provider)
======================= */
export const completeServiceRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const partner = await Partner.findOne({ user: req.userId });
    if (!partner) return res.status(403).json({ message: "Partner not authorized" });

    const request = await ServiceRequest.findOne({
      _id: requestId,
      assignedPartner: partner._id,
      status: "in_progress",
    }).populate("customerId", "_id name");

    if (!request) return res.status(400).json({ message: "Request not found or not in progress" });

    request.endTime = new Date();
    request.status = "completed";

    // Time calculation
    const startTime = request.startTime || new Date(request.endTime.getTime() - 3600000);
    let hours = Math.ceil((request.endTime - startTime) / (1000 * 60 * 60));
    hours = Math.max(1, hours);

    // Distance calculation
    const distance = getDistanceInKm(
      partner.location.lat, partner.location.lng,
      request.location.lat, request.location.lng
    );

    // Billing: totalAmount = serviceCharge + distanceCharge
    // platformFee (admin) = 20% of totalAmount
    // vendorShare = 80% of totalAmount
    const bill = calculateTotal(request.serviceType, hours, distance);

    const platformFee = Math.round(bill.totalAmount * 0.20);
    const vendorShare = bill.totalAmount - platformFee;

    request.distance = distance;
    request.serviceCharge = bill.serviceCharge;
    request.distanceCharge = bill.distanceCharge;
    request.billing = {
      baseCharge: bill.distanceCharge,
      workCharge: bill.serviceCharge,
      platformFee,
      totalAmount: bill.totalAmount,
      paymentStatus: "pending",
    };

    await request.save();

    // WS push to customer — billing modal trigger
    notifyUser(request.customerId._id.toString(), {
      type: "billing_ready",
      message: `✅ Service complete! Please confirm payment of ₹${bill.totalAmount}.`,
      data: {
        requestId: request._id,
        totalAmount: bill.totalAmount,
        serviceCharge: bill.serviceCharge,
        distanceCharge: bill.distanceCharge,
        platformFee,
        vendorShare,
      },
    });

    res.json({ message: "Service completed. Billing pending.", request });
  } catch (err) {
    console.error("COMPLETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   ADD BILLING (Customer confirms cash payment)
======================= */
export const addBilling = async (req, res) => {
  try {
    const { requestId, paymentMode } = req.body;

    const request = await ServiceRequest.findOne({
      _id: requestId,
      customerId: req.userId,
      status: "completed",
    }).populate("assignedPartner");

    if (!request) return res.status(400).json({ message: "Invalid request for billing" });

    if (request.billing?.paymentStatus === "paid") {
      return res.status(400).json({ message: "Billing already completed" });
    }

    // Use server-calculated values from completeServiceRequest
    const finalBaseCharge = request.billing?.baseCharge || 0;
    const finalWorkCharge = request.billing?.workCharge || 0;
    const subtotal = finalBaseCharge + finalWorkCharge;
    const finalPlatformFee = request.billing?.platformFee ?? Math.round(subtotal * 0.20);
    const finalTotalAmount = request.billing?.totalAmount ?? subtotal;
    const vendorShare = finalTotalAmount - finalPlatformFee;

    request.billing = {
      baseCharge: finalBaseCharge,
      workCharge: finalWorkCharge,
      platformFee: finalPlatformFee,
      totalAmount: finalTotalAmount,
      paymentMode,
      paymentStatus: "paid",
      billedAt: new Date(),
    };

    await request.save();

    // Credit vendor wallet
    if (request.assignedPartner?.user) {
      await creditWallet(
        request.assignedPartner.user,
        "vendor",
        vendorShare,
        `Payment for ${request.serviceType} service`,
        request._id
      );

      // WS notify vendor
      notifyUser(request.assignedPartner.user.toString(), {
        type: "payment_received",
        message: `💰 Payment of ₹${vendorShare} received for ${request.serviceType} service!`,
        data: { requestId: request._id, amount: vendorShare },
      });

      await Notification.create({
        user: request.assignedPartner.user,
        type: "billing",
        message: `Payment of ₹${vendorShare} received for ${request.serviceType}`,
      });
    }

    // Credit admin wallet
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      await creditWallet(
        adminUser._id,
        "admin",
        finalPlatformFee,
        `Platform fee for ${request.serviceType} service`,
        request._id
      );
    }

    res.json({ message: "Payment successful", billing: request.billing });
  } catch (err) {
    console.error("BILLING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   ADD RATING (Customer)
======================= */
export const addRating = async (req, res) => {
  try {
    const { requestId, stars, review } = req.body;

    const request = await ServiceRequest.findOne({
      _id: requestId,
      customerId: req.userId,
    }).populate("assignedPartner");

    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.billing?.paymentStatus !== "paid") {
      return res.status(403).json({ message: "Complete payment before rating" });
    }

    request.rating = { stars, review, ratedAt: new Date() };
    await request.save();

    // WS notify vendor of rating
    if (request.assignedPartner?.user) {
      notifyUser(request.assignedPartner.user.toString(), {
        type: "rating_received",
        message: `⭐ You received a ${stars}-star rating for ${request.serviceType}!`,
        data: { requestId: request._id, stars, review },
      });
    }

    res.json({ message: "Thanks for rating" });
  } catch (err) {
    console.error("RATING ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   GET PROVIDER STATS (Provider Dashboard)
======================= */
export const getProviderStats = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.userId });
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    const allJobs = await ServiceRequest.find({ assignedPartner: partner._id });

    const totalJobs = allJobs.length;
    const completedJobs = allJobs.filter(j => j.status === "completed").length;
    const pendingJobs = allJobs.filter(j => ["assigned", "in_progress"].includes(j.status)).length;
    const rejectedJobs = allJobs.filter(j => j.status === "rejected").length;

    const paidJobs = allJobs.filter(j => j.billing?.paymentStatus === "paid");
    const totalEarnings = paidJobs.reduce((sum, j) => {
      const vendorShare = (j.billing.totalAmount || 0) - (j.billing.platformFee || 0);
      return sum + vendorShare;
    }, 0);

    // Monthly earnings breakdown (last 6 months)
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const earningsByMonth = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthNames[d.getMonth()];
      earningsByMonth[key] = 0;
    }

    paidJobs.forEach(j => {
      const d = new Date(j.billing.billedAt || j.updatedAt);
      const key = monthNames[d.getMonth()];
      if (earningsByMonth.hasOwnProperty(key)) {
        earningsByMonth[key] += (j.billing.totalAmount || 0) - (j.billing.platformFee || 0);
      }
    });

    const earningsData = Object.entries(earningsByMonth).map(([month, earnings]) => ({ month, earnings }));

    // Status distribution for pie chart
    const statusData = [
      { name: "Completed", value: completedJobs },
      { name: "Pending", value: pendingJobs },
      { name: "Rejected/Cancelled", value: rejectedJobs },
    ];

    // Rating distribution
    const ratedJobs = allJobs.filter(j => j.rating?.stars);
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratedJobs.forEach(j => { ratingDist[j.rating.stars] = (ratingDist[j.rating.stars] || 0) + 1; });
    const ratingDistribution = Object.entries(ratingDist).map(([stars, count]) => ({ stars: `${stars}★`, count }));

    const avgRating = ratedJobs.length
      ? +(ratedJobs.reduce((sum, j) => sum + j.rating.stars, 0) / ratedJobs.length).toFixed(1)
      : 0;

    // Wallet balance
    const wallet = await Wallet.findOne({ owner: req.userId });

    res.json({
      success: true,
      stats: {
        totalJobs,
        completedJobs,
        pendingJobs,
        totalEarnings,
        avgRating,
        walletBalance: wallet?.balance || 0,
      },
      earningsData,
      statusData,
      ratingDistribution,
    });
  } catch (error) {
    console.error("GET PROVIDER STATS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};

/* =======================
   CREATE SOS EMERGENCY REQUEST (Customer)
======================= */
export const createEmergencySOS = async (req, res) => {
  try {
    let { serviceType, problemDescription, location } = req.body;
    serviceType = serviceType?.trim().toLowerCase();

    if (!serviceType || !problemDescription || !location?.lat || !location?.lng) {
      return res.status(400).json({ message: "All fields are required for SOS" });
    }

    // Prevent duplicate active SOS within 10 minutes
    const existing = await ServiceRequest.findOne({
      customerId: req.userId,
      isEmergency: true,
      status: "open",
      createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) },
    });
    if (existing) {
      return res.status(400).json({ message: "You already have an active SOS request. Please wait." });
    }

    const service = await ServiceRequest.create({
      customerId: req.userId,
      serviceType,
      problemDescription,
      location,
      status: "open",
      isEmergency: true,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min window for SOS
    });

    // Find nearby approved partners matching profession within 25km
    const partners = await Partner.find({
      isAvailable: true,
      status: "approved",
      profession: { $regex: `^${serviceType}$`, $options: "i" },
      location: { $exists: true },
    });

    const nearbyPartners = partners.filter((p) => {
      if (!p.location?.lat || !p.location?.lng) return false;
      const distance = getDistanceInKm(p.location.lat, p.location.lng, location.lat, location.lng);
      return distance <= 25;
    });

    // Save DB notifications for nearby partners
    await Notification.insertMany(
      nearbyPartners.map((p) => ({
        user: p.user,
        message: `🚨 EMERGENCY: ${problemDescription} near your location`,
        type: "service_request",
        relatedId: service._id,
        status: "unread",
      }))
    );

    // Push real-time WebSocket SOS alert to all nearby partners
    nearbyPartners.forEach((p) => {
      notifyUser(p.user.toString(), {
        type: "sos_request_alert",
        message: `🚨 URGENT SOS: ${problemDescription} near you!`,
        data: {
          requestId: service._id,
          serviceType,
          problemDescription,
          location,
          isEmergency: true,
        },
      });
    });

    res.status(201).json({
      message: "SOS request broadcasted successfully",
      service,
      notifiedPartners: nearbyPartners.length,
    });
  } catch (error) {
    console.error("SOS EMERGENCY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =======================
   REPORT FAKE SOS (Provider)
======================= */
export const reportFakeSOS = async (req, res) => {
  try {
    const { requestId } = req.body;

    // Verify this partner is assigned to the request
    const partner = await Partner.findOne({ user: req.userId });
    if (!partner) return res.status(403).json({ message: "Not authorized" });

    const request = await ServiceRequest.findOne({
      _id: requestId,
      assignedPartner: partner._id,
      isEmergency: true,
      status: { $in: ["assigned", "in_progress"] },
    }).populate("customerId", "_id name email");

    if (!request) {
      return res.status(404).json({ message: "Emergency request not found or not assigned to you" });
    }

    // Mark the request as fake_terminated
    request.status = "fake_terminated";
    await request.save();

    // Close related notifications
    await Notification.updateMany({ relatedId: requestId }, { status: "closed" });

    const customerId = request.customerId._id;
    const customerName = request.customerId.name;

    // Find all admins to notify
    const admins = await User.find({ role: "admin" });
    const adminIds = admins.map((a) => a._id.toString());

    // Notify all admins via WebSocket
    notifyMany(adminIds, {
      type: "fake_sos_alert",
      message: `⚠️ Fake SOS reported! User: ${customerName} (ID: ${customerId}) filed a fake emergency for "${request.serviceType}". Request #${requestId} terminated.`,
      data: {
        requestId: request._id,
        customerId,
        customerName,
        serviceType: request.serviceType,
        problemDescription: request.problemDescription,
        reportedBy: partner.fullName,
      },
    });

    // Save DB notification for admins
    await Notification.insertMany(
      admins.map((a) => ({
        user: a._id,
        message: `⚠️ Fake SOS alert: ${customerName} filed a fake emergency for "${request.serviceType}". Reported by ${partner.fullName}.`,
        type: "status_update",
        status: "unread",
      }))
    );

    // Notify the customer that their SOS was terminated
    notifyUser(customerId.toString(), {
      type: "fake_sos_warning",
      message: `🚫 Your emergency SOS for "${request.serviceType}" has been terminated. Our partner flagged it as non-genuine. This incident has been reported to administrators and recorded on your account.`,
      data: { requestId: request._id },
    });

    // Save DB notification for customer
    await Notification.create({
      user: customerId,
      message: `Your SOS request was terminated for being flagged as a fake emergency. This has been reported to Sahayak admin.`,
      type: "status_update",
      status: "unread",
    });

    res.json({ message: "Fake SOS reported successfully. Request terminated and admins notified." });
  } catch (err) {
    console.error("REPORT FAKE SOS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
