import express from "express";
import Notification from "../modal/Notification.js";
import protect from "../middlewares/protect.js";

const NotificationRouter = express.Router();

NotificationRouter.get("/my", protect, async (req, res) => {
  try {
    console.log("NOTIFICATION USER ID:", req.userId); // ✅ DEBUG

    const notifications = await Notification.find({
      user: req.userId, // ✅ FIX HERE
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("NOTIFICATION FETCH ERROR:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

export default NotificationRouter;
