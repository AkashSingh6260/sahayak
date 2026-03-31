import mongoose from "mongoose";

const partnerApplicationSchema = new mongoose.Schema(
  {
    /* Applicant user */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one active application per user
    },

    /* Basic details */
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
    },

    profession: {
      type: String,
      required: true,
      lowercase: true,
    },

    workType: {
      type: String,
      required: true,
    },

    experience: {
      type: Number,
      min: 0,
      default: 0,
    },

    /* Location */
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },

    /* Documents */
    idProof: {
      type: String, // file URL
      required: true,
    },

    skillProof: {
      type: String, // file URL
      required: true,
    },

    /* Admin review */
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // admin
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "PartnerApplication",
  partnerApplicationSchema
);
