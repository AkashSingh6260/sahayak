import express from "express";
import protect from "../middlewares/protect.js";
import {
    deleteRequest,
  getMyRequests,
} from "../controllers/requestController.js";
import ServiceRequest from "../modal/Service.js";

const RequestRouter = express.Router();



// GET pending billing for the logged-in user
RequestRouter.get("/pending-billing", protect, async (req, res) => {
  try {
    const requests = await ServiceRequest.find({
      customerId: req.userId,
      status: "completed",
      $or: [
        { "billing.paymentStatus": { $exists: false } },
        { "billing.paymentStatus": "pending" }
      ]
    });
    res.json({ requests });
  } catch (err) {
    console.error("Fetch pending billing error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




RequestRouter.get("/my", protect, getMyRequests);
RequestRouter.delete("/:id", protect, deleteRequest);

export default RequestRouter;
