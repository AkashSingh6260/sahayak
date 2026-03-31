import Partner from "../modal/Partner.js";
import User from "../modal/User.js";
import Notification from "../modal/Notification.js";
import ServiceRequest from "../modal/Service.js";
import { notifyUser } from "../socket.js";

/**
 * GET all partner applications
 */
export const getAllApplications = async (req, res) => {
  try {
    const { status, serviceType } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (serviceType) filter.workType = serviceType;

    const applications = await Partner.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    console.error("GET APPLICATIONS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

/**
 * GET single application
 */
export const getSingleApplication = async (req, res) => {
  try {
    const application = await Partner.findById(req.params.id).populate("user", "name email");
    if (!application) return res.status(404).json({ message: "Application not found" });
    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error("GET SINGLE APPLICATION ERROR:", error);
    res.status(500).json({ message: "Failed to fetch application" });
  }
};

/**
 * Approve or Reject application
 */
export const verifyApplication = async (req, res) => {
  console.log("REQ.BODY:", req.body);
  console.log("REQ.PARAMS.ID:", req.params.id);
  try {
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const application = await Partner.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (!application.user) return res.status(400).json({ message: "Application missing user" });

    application.status = status;
    application.verifiedBy = req.userId;
    application.rejectionReason = status === "rejected" ? rejectionReason || "Not specified" : "";
    await application.save();

    const user = await User.findById(application.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (status === "approved") {
      user.role = "service_provider";
      user.isPartnerVerified = true;
    } else {
      user.role = "user";
      user.isPartnerVerified = false;
    }
    await user.save();

    const notifMsg = status === "approved"
      ? "🎉 Your service provider application has been approved! You can now accept service requests."
      : `❌ Your application was rejected: ${rejectionReason || "Not specified"}`;

    // Save DB notification
    await Notification.create({ user: application.user, message: notifMsg });

    // Push real-time WS notification
    notifyUser(application.user.toString(), {
      type: status === "approved" ? "application_approved" : "application_rejected",
      message: notifMsg,
      data: { status, rejectionReason },
    });

    res.status(200).json({ success: true, message: `Application ${status}`, application });
  } catch (error) {
    console.error("VERIFY APPLICATION ERROR:", error);
    res.status(500).json({ message: "Verification failed" });
  }
};

/**
 * Dashboard statistics
 */
export const adminDashboardStats = async (req, res) => {
  try {
    const total = await Partner.countDocuments();
    const pending = await Partner.countDocuments({ status: "pending" });
    const approved = await Partner.countDocuments({ status: "approved" });
    const rejected = await Partner.countDocuments({ status: "rejected" });

    const paidRequests = await ServiceRequest.find({ "billing.paymentStatus": "paid" });
    const totalPlatformRevenue = paidRequests.reduce((sum, req) => 
      sum + (req.billing?.platformFee || Math.round((req.billing?.totalAmount || 0) * 0.20)), 0);
    const totalBusinessVolume = paidRequests.reduce((sum, req) => sum + (req.billing?.totalAmount || 0), 0);

    // Monthly revenue breakdown (last 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const revenueByMonth = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      revenueByMonth[monthNames[d.getMonth()]] = 0;
    }
    paidRequests.forEach(r => {
      const d = new Date(r.billing.billedAt || r.updatedAt);
      const key = monthNames[d.getMonth()];
      if (revenueByMonth.hasOwnProperty(key)) {
        revenueByMonth[key] += r.billing?.platformFee || Math.round((r.billing?.totalAmount || 0) * 0.20);
      }
    });
    const revenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue }));

    // Service type breakdown
    const serviceTypeCount = {};
    paidRequests.forEach(r => {
      const s = r.serviceType || "other";
      serviceTypeCount[s] = (serviceTypeCount[s] || 0) + 1;
    });
    const serviceBreakdown = Object.entries(serviceTypeCount).map(([name, value]) => ({ name, value }));

    res.status(200).json({
      success: true,
      stats: { total, pending, approved, rejected, totalPlatformRevenue, totalBusinessVolume },
      revenueData,
      serviceBreakdown,
    });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
