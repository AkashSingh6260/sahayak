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

  
    idProof: {
      type: String,
      required: true,
    },

    skillProof: {
      type: String, 
      required: true,
    },

   
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
      ref: "User", 
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
