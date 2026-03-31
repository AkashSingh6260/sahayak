import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  description: { type: String, required: true },
  serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceRequest" },
  at: { type: Date, default: Date.now },
});

const walletSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["vendor", "admin"],
      required: true,
    },
    balance: { type: Number, default: 0 },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);
