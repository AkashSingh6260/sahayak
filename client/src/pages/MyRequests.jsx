import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Trash2,
  MapPin,
  FileText,
  Briefcase,
  Phone,
  Star,
  User,
  CreditCard,
  Target,
  FileCheck
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import useWebSocket from "../hooks/useWebSocket.js";

const statusStyles = {
  pending: {
    label: "Pending",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    accent: "border-l-yellow-400",
    icon: <Clock size={14} className="text-yellow-600" />,
  },
  open: {
    label: "Pending",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    accent: "border-l-yellow-400",
    icon: <Clock size={14} className="text-yellow-600" />,
  },
  accepted: {
    label: "Accepted",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accent: "border-l-emerald-400",
    icon: <CheckCircle size={14} className="text-emerald-600" />,
  },
  assigned: {
    label: "Accepted",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    accent: "border-l-emerald-400",
    icon: <CheckCircle size={14} className="text-emerald-600" />,
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    accent: "border-l-blue-400",
    icon: <Clock size={14} className="animate-spin text-blue-600" />,
  },
  completed: {
    label: "Completed",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    accent: "border-l-slate-400",
    icon: <CheckCircle size={14} className="text-slate-600" />,
  },
  rejected: {
    label: "Rejected",
    badge: "bg-rose-100 text-rose-700 border-rose-200",
    accent: "border-l-rose-400 font-bold",
    icon: <XCircle size={14} className="text-rose-600" />,
    message: "Request rejected, please try another service provider."
  },
};

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");

  const REQUESTS_URL = "http://localhost:3000/api/requests";
  const SERVICES_URL = "http://localhost:3000/api/services";
  const token = localStorage.getItem("token");

  const fetchRequests = useCallback(async () => {
    try {
      const res = await axios.get(`${REQUESTS_URL}/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data || []);
    } catch {
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  }, []);

  // DEDUPLICATED REQUESTS LIST
  const uniqueRequests = requests.reduce((acc, current) => {
    const x = acc.find(item => item._id === current._id);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, []);

  const deleteRequest = async (id) => {
    if (!window.confirm("Delete this request?")) return;
    try {
      await axios.delete(`${REQUESTS_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests((prev) => prev.filter((r) => r._id !== id));
      toast.success("Request deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const submitRating = async () => {
    if (!rating) return toast.error("Please select a rating");
    try {
      // ✅ Fixed: correct endpoint is /api/services/rating
      await axios.post(
        `${SERVICES_URL}/rating`,
        {
          requestId: selectedRequest._id,
          stars: rating,
          review,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Thanks for rating 🙌");
      setSelectedRequest(null);
      setRating(0);
      setReview("");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rating failed");
    }
  };

  const handlePay = async (requestId) => {
    try {
      // 1. Create order on backend
      const { data: order } = await axios.post(
        "http://localhost:3000/api/orders/create-order",
        { requestId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Open Razorpay Checkout
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
            // 3. Verify payment on backend
            const verifyRes = await axios.post(
              "http://localhost:3000/api/orders/verify-payment",
              {
                ...response,
                requestId
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              toast.success("Payment Successful! 🎉", { id: tid });
              fetchRequests(); // Refresh list to unlock rating
            }
          } catch (err) {
            toast.error("Payment verification failed", { id: tid });
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment was cancelled or closed.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    }
  };

  useEffect(() => {
    fetchRequests();

    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // WebSocket real-time updates instead of polling
  const handleWsMessage = useCallback((payload) => {
    if (["request_accepted", "otp_sent", "service_started", "billing_ready", "rating_received"].includes(payload.type)) {
      fetchRequests();
    }
  }, [fetchRequests]);

  useWebSocket(handleWsMessage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Service Requests</h2>
          <p className="text-slate-500 mt-2">Track your current bookings and rate your service providers.</p>
        </div>

        {uniqueRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No requests found.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {uniqueRequests.map((req) => {
              const isAccepted = ["assigned", "in_progress", "completed", "accepted"].includes(req.status);
              const alreadyRated = !!req.rating?.stars;
              // canRate: completed + paid + NOT already rated
              const canRate = req.status === "completed" && req.billing?.paymentStatus === "paid" && !alreadyRated;
              const status = statusStyles[req.status] || statusStyles.pending;

              return (
                <div
                  key={req._id}
                  onClick={() => canRate && setSelectedRequest(req)}
                  className={`bg-white border-l-4 ${status.accent} border rounded-2xl p-6 shadow-sm transition-all
                  ${canRate ? "cursor-pointer hover:shadow-md ring-emerald-500/10 hover:ring-4" : ""}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="p-3 bg-indigo-50 rounded-xl">
                        <Briefcase size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold capitalize text-slate-800">
                          {req.serviceType?.replace("_", " ") || "Service Request"}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={13} />
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                          <span className="text-slate-300">|</span>
                          <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                            <MapPin size={13} /> Service Location
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full border ${status.badge}`}>
                      {status.icon}
                      {status.label.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-6 bg-slate-50 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider mb-1">Issue Reported:</span>
                      {req.problemDescription || "No description provided."}
                    </p>
                    {req.status === "rejected" && (
                      <p className="mt-3 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 flex items-center gap-2">
                        <XCircle size={14} /> Request rejected, please try another service provider.
                      </p>
                    )}
                  </div>

                  {/* PROVIDER DETAILS - Added strict Optional Chaining to prevent charAt error */}
                  {isAccepted && req.assignedPartner && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
                            {/* FIX: Using optional chaining and fallback for the initial */}
                            {req.assignedPartner?.fullName?.[0] || <User size={20} />}
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Assigned Partner</p>
                            <p className="text-sm font-bold text-slate-800">{req.assignedPartner?.fullName || "Professional"}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {req.assignedPartner?.phone || "Contact hidden"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-yellow-50 px-3 py-2 rounded-xl border border-yellow-100 text-center">
                          <div className="flex items-center justify-center gap-1 text-yellow-600 font-bold text-sm">
                            <Star size={14} fill="currentColor" />
                            {req.assignedPartner?.averageRating?.toFixed(1) || "5.0"}
                          </div>
                          <p className="text-[9px] text-yellow-700 font-medium mt-0.5">SCORE</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OTP DISPLAY FOR CUSTOMER */}
                  {req.status === "assigned" && req.otp && (
                    <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Share this OTP to start work</p>
                        <p className="text-sm text-indigo-700">Give this to the professional when they arrive.</p>
                      </div>
                      <div className="bg-white px-5 py-2 rounded-lg shadow-sm font-mono text-xl font-bold tracking-[0.2em] text-indigo-600 border border-indigo-200">
                        {req.otp}
                      </div>
                    </div>
                  )}

                  {/* FINAL INVOICE & PAY UI */}
                  {req.status === "completed" && req.billing && (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                          <div className="flex items-center gap-2 text-slate-800 font-bold">
                            <FileCheck size={18} className="text-emerald-500" /> Final Invoice
                          </div>
                          {req.billing.paymentStatus === "paid" && (
                            <div className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                              PAID
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-slate-600 text-xs">
                            <span>Service Charge</span>
                            <span className="font-medium text-slate-800">₹{req.billing.workCharge || 0}</span>
                          </div>
                          <div className="flex justify-between text-slate-600 text-xs">
                            <span className="flex items-center gap-1"><MapPin size={12} /> Distance Charge</span>
                            <span className="font-medium text-slate-800">₹{req.billing.baseCharge || 0}</span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between font-bold text-lg text-slate-900 border-dashed">
                            <span>Total Amount</span>
                            <span>₹{req.billing.totalAmount || 0}</span>
                          </div>
                        </div>

                        {req.billing.paymentStatus === "pending" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePay(req._id); }}
                            className="mt-5 w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
                          >
                            <CreditCard size={18} /> Pay ₹{req.billing.totalAmount} Now
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    {alreadyRated ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Your Rating:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star
                              key={s}
                              size={14}
                              className={s <= req.rating.stars ? "text-yellow-400" : "text-slate-200"}
                              fill={s <= req.rating.stars ? "currentColor" : "none"}
                            />
                          ))}
                        </div>
                        {req.rating.review && (
                          <span className="text-xs text-slate-400 italic truncate max-w-[120px]">&ldquo;{req.rating.review}&rdquo;</span>
                        )}
                      </div>
                    ) : canRate ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Star size={14} className="animate-pulse" /> Click card to rate provider
                      </span>
                    ) : isAccepted ? (
                      <p className="text-[11px] font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                        Complete payment to unlock rating
                      </p>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRequest(req._id);
                        }}
                        className="text-rose-500 text-xs font-bold flex items-center gap-1.5 hover:text-rose-700 transition"
                      >
                        <Trash2 size={14} /> CANCEL REQUEST
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RATING MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={32} fill="currentColor" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Service Rating</h3>
              <p className="text-sm text-slate-500 mt-1">
                How was your experience with <span className="font-bold text-slate-700">{selectedRequest.assignedPartner?.fullName || "the professional"}</span>?
              </p>
            </div>

            <div className="flex justify-center gap-2 my-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform active:scale-90"
                >
                  <Star
                    size={40}
                    className={`transition-colors duration-200 ${(hoverRating || rating) >= star ? "text-yellow-400" : "text-slate-200"
                      }`}
                    fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell us about the service..."
              rows={3}
              className="w-full border-slate-200 border-2 rounded-2xl p-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none"
            />

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => setSelectedRequest(null)}
                className="py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition"
              >
                Skip
              </button>
              <button
                onClick={submitRating}
                className="py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;