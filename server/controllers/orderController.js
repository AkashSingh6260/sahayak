import crypto from "crypto";
import ServiceRequest from "../modal/Service.js";
import Notification from "../modal/Notification.js";
import Wallet from "../modal/Wallet.js";
import User from "../modal/User.js";
import { notifyUser } from "../socket.js";
import razorpay from "../configs/razorpay.js";

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
   CREATE ORDER (UPI via Razorpay)
======================= */
export const createOrder = async (req, res) => {
  try {
    const { requestId } = req.body;
    const request = await ServiceRequest.findById(requestId);

    if (!request) return res.status(404).json({ message: "Request not found" });
    if (!request.billing?.totalAmount) {
      return res.status(400).json({ message: "Billing not generated yet" });
    }

    const options = {
      amount: Math.round(request.billing.totalAmount * 100),
      currency: "INR",
      receipt: `receipt_order_${requestId}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("RAZORPAY CREATE ORDER ERROR:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* =======================
   VERIFY PAYMENT + CREDIT WALLETS (UPI)
======================= */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, requestId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: "Invalid signature sent!", success: false });
    }

    const request = await ServiceRequest.findById(requestId).populate("assignedPartner");
    if (!request) return res.status(404).json({ message: "Request not found" });

    // Mark as paid
    request.billing.paymentStatus = "paid";
    request.billing.paymentMode = "upi";
    request.billing.billedAt = new Date();
    await request.save();

    const totalAmount = request.billing.totalAmount || 0;
    const platformFee = request.billing.platformFee || Math.round(totalAmount * 0.20);
    const vendorShare = totalAmount - platformFee;

    // Credit vendor wallet + notify
    if (request.assignedPartner?.user) {
      await creditWallet(
        request.assignedPartner.user,
        "vendor",
        vendorShare,
        `UPI payment for ${request.serviceType} service`,
        request._id
      );

      notifyUser(request.assignedPartner.user.toString(), {
        type: "payment_received",
        message: `💰 UPI Payment of ₹${vendorShare} received for ${request.serviceType} service!`,
        data: { requestId: request._id, amount: vendorShare },
      });

      await Notification.create({
        user: request.assignedPartner.user,
        type: "billing",
        message: `UPI Payment of ₹${vendorShare} received for ${request.serviceType}`,
      });
    }

    // Credit admin wallet
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser) {
      await creditWallet(
        adminUser._id,
        "admin",
        platformFee,
        `Platform fee (UPI) for ${request.serviceType} service`,
        request._id
      );
    }

    return res.json({ message: "Payment verified successfully", success: true });
  } catch (error) {
    console.error("RAZORPAY VERIFY ERROR:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
