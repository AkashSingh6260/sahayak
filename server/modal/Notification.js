import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["service_request", "status_update", "billing", "general"],
      default: "general",
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "onModel",
    },
    onModel: {
      type: String,
      enum: ["ServiceRequest", "Partner"],
    },
    status: {
      type: String,
      enum: ["unread", "read", "closed"],
      default: "unread",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
 