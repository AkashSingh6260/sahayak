import React, { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";
import api from "../config/api";
import toast, { Toaster } from "react-hot-toast";
import useWebSocket from "../hooks/useWebSocket.js";
import { useSelector } from "react-redux";

const MainLayout = () => {
  const [pendingBilling, setPendingBilling] = useState([]);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState("");
  const user = useSelector((state) => state.auth.user);

  /* =======================
     Fetch Pending Billing (initial load + WS trigger)
  ======================= */
  const fetchPendingBilling = useCallback(async () => {
    try {
      const { data } = await api.get("/services/pending-billing");
      if (data.requests?.length > 0) {
        setPendingBilling(data.requests);
        setShowBillingModal(true);
      } else {
        setPendingBilling([]);
        setShowBillingModal(false);
      }
    } catch (err) {
      console.error("Failed to fetch pending billing", err);
    }
  }, []);

  useEffect(() => {
    fetchPendingBilling(); // initial check on mount

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  /* =======================
     WebSocket — replace polling
     On billing_ready event → fetch pending billing immediately
  ======================= */
  const handleWsMessage = useCallback((payload) => {
    if (payload.type === "billing_ready") {
      // Small delay to ensure DB is written before fetching
      setTimeout(() => fetchPendingBilling(), 500);
    }
  }, [fetchPendingBilling]);

  useWebSocket(handleWsMessage, !!user);

  /* =======================
     Handle Payment
  ======================= */
  const handlePay = async (requestId) => {
    if (!paymentMode) {
      toast.error("Please select payment mode");
      return;
    }

    if (paymentMode === "upi") {
      try {
        const { data: order } = await api.post("/orders/create-order", { requestId });

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "Sahayak Services",
          description: "Service Payment",
          order_id: order.id,
          handler: async (response) => {
            const tid = toast.loading("Verifying payment...");
            try {
              const verifyRes = await api.post("/orders/verify-payment", {
                ...response,
                requestId,
              });
              if (verifyRes.data.success) {
                toast.success("Payment Successful! 🎉", { id: tid });
                setShowBillingModal(false);
                setPendingBilling([]);
                setPaymentMode("");
              }
            } catch (err) {
              toast.error("Payment verification failed", { id: tid });
            }
          },
          theme: { color: "#4f46e5" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        toast.error("Failed to initiate Razorpay");
      }
      return;
    }

    // CASH MODE
    try {
      await api.post("/services/billing", { requestId, paymentMode });
      toast.success("Payment recorded! 🎉");
      setShowBillingModal(false);
      setPendingBilling([]);
      setPaymentMode("");
    } catch (err) {
      console.error("Payment failed", err);
      toast.error("Payment registration failed");
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <Navbar />
      <Outlet />

      {/* Pending Billing Modal */}
      {showBillingModal && pendingBilling.length > 0 && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Complete Your Payment</h2>
            <p className="text-sm text-slate-500 mb-5">Your service is complete — please confirm payment.</p>

            {pendingBilling
              .filter((r, i, arr) =>
                arr.findIndex((x) => x._id === r._id) === i
              )
              .map((req) => {
                const total = req.billing?.totalAmount || 0;
                const platform = req.billing?.platformFee || Math.round(total * 0.20);
                const vendor = total - platform;

                return (
                  <div key={req._id} className="border rounded-xl p-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="space-y-1.5 text-sm text-gray-700 mb-3">
                      <p><span className="font-semibold text-gray-900">Service:</span> {req.serviceType}</p>
                      <p><span className="font-semibold text-gray-900">Problem:</span> {req.problemDescription}</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white rounded-lg py-2">
                          <p className="text-xs text-slate-400">Service</p>
                          <p className="font-bold text-slate-800">₹{req.billing?.workCharge || 0}</p>
                        </div>
                        <div className="bg-white rounded-lg py-2">
                          <p className="text-xs text-slate-400">Distance</p>
                          <p className="font-bold text-slate-800">₹{req.billing?.baseCharge || 0}</p>
                        </div>
                        <div className="bg-indigo-100 rounded-lg py-2">
                          <p className="text-xs text-indigo-500">Total</p>
                          <p className="font-bold text-indigo-700">₹{total}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 text-center mt-1">Platform fee: ₹{platform} (20%) · Vendor: ₹{vendor} (80%)</p>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">Select payment method</option>
                        <option value="cash">Cash</option>
                        <option value="upi">UPI (Razorpay)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handlePay(req._id)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition"
                    >
                      Pay ₹{total} Now
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
};

export default MainLayout;
