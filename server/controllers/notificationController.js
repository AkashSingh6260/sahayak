
import Notification from "../modal/Notification.js";

export const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({
    user: req.userId,
    status: "unread",
  }).sort({ createdAt: -1 });

  res.json(notifications);
};

export const markNotificationRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    status: "read",
  });

  res.json({ message: "Notification updated" });
};
