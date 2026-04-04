import express from "express";
import protect from "../middlewares/protect.js";
import ServiceRequest from "../modal/Service.js";
import mongoose from "mongoose";

import {
  createServiceRequest,
  cancelServiceRequest,
  getNearbyRequests,
  acceptServiceRequest,
  sendOTPToCustomer,
  verifyOTPAndStart,
  completeServiceRequest,
  addBilling,
  addRating,
  rejectServiceRequest,
  getProviderStats,
  createSOSRequest,
  submitSOSFeedback
} from "../controllers/serviceController.js";

const ServiceRouter = express.Router();

/* Customer */
ServiceRouter.post("/", protect, createServiceRequest);
ServiceRouter.patch("/cancel", protect, cancelServiceRequest);

/* Provider */
ServiceRouter.get("/nearby", protect, getNearbyRequests);
ServiceRouter.get("/stats", protect, getProviderStats);
ServiceRouter.patch("/accept", protect, acceptServiceRequest);
ServiceRouter.patch("/send-otp", protect, sendOTPToCustomer);
ServiceRouter.patch("/start", protect, verifyOTPAndStart);
ServiceRouter.patch("/reject", protect, rejectServiceRequest);
ServiceRouter.patch("/complete", protect, completeServiceRequest);
ServiceRouter.post("/billing", protect, addBilling);
ServiceRouter.post("/rating", protect, addRating);

/* SOS */
ServiceRouter.post("/sos", protect, createSOSRequest);
ServiceRouter.post("/sos/feedback", protect, submitSOSFeedback);

// GET /api/services/pending-billing
ServiceRouter.get("/pending-billing", protect, async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      customerId: new mongoose.Types.ObjectId(req.userId),
      status: "completed",
      "billing.paymentStatus": "pending",
    }).sort({ updatedAt: -1 });

    res.json({ requests });
  } catch (err) {
    console.error("Pending billing error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



export default ServiceRouter;
