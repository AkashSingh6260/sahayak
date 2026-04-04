import { useState } from "react";
import api from "../config/api";

export default function BillingModal({ request, onPaid }) {
  const [paymentMode, setPaymentMode] = useState("upi");
  const [paying, setPaying] = useState(false);

  const baseCharge = request.billing?.baseCharge || 300;
  const workCharge = request.billing?.workCharge || 500;
  const platformFee = Math.round((baseCharge + workCharge) * 0.1);
  const totalAmount = baseCharge + workCharge + platformFee;

  const payNow = async () => {
    try {
      setPaying(true);

      await api.post("/services/billing", {
        requestId: request._id,
        baseCharge,
        workCharge,
        paymentMode,
      });

      onPaid(); // 🔓 unlock app
    } catch (err) {
      alert("Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
      <h2 className="text-xl font-bold mb-2">
        Payment Required
      </h2>

      <p className="text-slate-600 mb-4">
        Your service is completed. Please complete payment
        to continue using the app.
      </p>

      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <Row label="Base Charge" value={baseCharge} />
        <Row label="Work Charge" value={workCharge} />
        <Row label="Platform Fee" value={platformFee} small />
        <div className="border-t pt-2 flex justify-between font-semibold">
          <span>Total</span>
          <span className="text-indigo-600">
            ₹{totalAmount}
          </span>
        </div>
      </div>

      <select
        className="mt-4 w-full border rounded-lg px-3 py-2"
        value={paymentMode}
        onChange={(e) => setPaymentMode(e.target.value)}
      >
        <option value="upi">UPI</option>
        <option value="cash">Cash</option>
      </select>

      <button
        disabled={paying}
        onClick={payNow}
        className="mt-5 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold"
      >
        {paying ? "Processing..." : `Pay ₹${totalAmount}`}
      </button>
    </div>
  );
}

function Row({ label, value, small }) {
  return (
    <div
      className={`flex justify-between ${
        small ? "text-sm text-slate-500" : ""
      }`}
    >
      <span>{label}</span>
      <span>₹{value}</span>
    </div>
  );
}
