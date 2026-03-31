import React, { useEffect, useState, useCallback } from "react";
import {
  MapPin, FileText, CheckCircle, X, Navigation, Clock, Play
} from "lucide-react";
import api from "../../config/api.js";
import useWebSocket from "../../hooks/useWebSocket.js";
import toast from "react-hot-toast";

/* =======================
   DISTANCE UTILITY
======================= */
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
};

/* =======================
   LIVE TIMER COMPONENT
======================= */
const LiveTimer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState("00:00:00");
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, now - start);
      const hours = Math.floor(diff / 3600000).toString().padStart(2, "0");
      const mins = Math.floor((diff % 3600000) / 60000).toString().padStart(2, "0");
      const secs = Math.floor((diff % 60000) / 1000).toString().padStart(2, "0");
      setElapsed(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2 text-emerald-600 font-bold font-mono text-lg tracking-wider">
      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
      {elapsed}
    </div>
  );
};

export default function ProviderRequest() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerLocation, setProviderLocation] = useState(null);
  const [mapLocation, setMapLocation] = useState(null);
  const [otpInputs, setOtpInputs] = useState({});
  const [otpSentStatus, setOtpSentStatus] = useState({});

  const fetchProviderProfile = async () => {
    try {
      const { data } = await api.get("/partners/me");
      if (data.partner?.location) setProviderLocation(data.partner.location);
    } catch (err) {
      console.error("Failed to fetch provider profile", err);
    }
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/services/nearby");
      setRequests(Array.isArray(data?.requests) ? data.requests : []);
    } catch (err) {
      console.error("Failed to load requests", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviderProfile();
    fetchRequests();
  }, []);

  /* =======================
     WebSocket — live new_request + request_cancelled
  ======================= */
  const handleWsMessage = useCallback((payload) => {
    if (payload.type === "new_request") {
      toast("📣 New request near you!", { icon: "🔔", duration: 4000 });
      fetchRequests(); // refresh list
    }
    if (payload.type === "request_cancelled") {
      const cancelledId = payload.data?.requestId?.toString();
      setRequests((prev) => prev.filter((r) => r._id.toString() !== cancelledId));
      toast("Request was cancelled by customer.", { icon: "❌" });
    }
  }, [fetchRequests]);

  useWebSocket(handleWsMessage);

  const uniqueRequests = requests.reduce((acc, current) => {
    const isDuplicate = acc.find(
      (item) =>
        item.problemDescription === current.problemDescription &&
        item.customerId === current.customerId &&
        item.status === current.status
    );
    return isDuplicate ? acc : acc.concat([current]);
  }, []);

  /* =======================
     ACCEPT JOB
  ======================= */
  const acceptJob = async (req, e) => {
    e.stopPropagation();
    try {
      await api.patch("/services/accept", { requestId: req._id });
      setRequests((prev) =>
        prev.map((r) => r._id === req._id ? { ...r, status: "assigned" } : r)
      );
      toast.success("Job accepted! 🎉", {
        style: { background: "#4f46e5", color: "#fff", fontWeight: "600", borderRadius: "12px" },
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to accept job");
    }
  };

  /* =======================
     REJECT JOB (just hide from view — no DB status change)
  ======================= */
  const rejectJob = async (req, e) => {
    e.stopPropagation();
    if (!window.confirm("Skip this request?")) return;
    try {
      await api.patch("/services/reject", { requestId: req._id });
      // Remove from local list only
      setRequests((prev) => prev.filter((r) => r._id !== req._id));
      toast("Request skipped", { icon: "👋" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to skip");
    }
  };

  /* =======================
     SEND OTP
  ======================= */
  const triggerSendOTP = async (reqId, e) => {
    e.stopPropagation();
    const tid = toast.loading("Sending OTP to customer's email...");
    try {
      await api.patch("/services/send-otp", { requestId: reqId });
      toast.success("OTP sent to registered email! 📧", { id: tid });
      setOtpSentStatus((prev) => ({ ...prev, [reqId]: true }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP", { id: tid });
    }
  };

  /* =======================
     START JOB (OTP Verify)
  ======================= */
  const startJob = async (req, e) => {
    e.stopPropagation();
    const otp = otpInputs[req._id];
    if (!otp || otp.length < 6) return toast.error("Enter a valid 6-digit OTP");
    try {
      await api.patch("/services/start", { requestId: req._id, otp });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === req._id ? { ...r, status: "in_progress", startTime: new Date() } : r
        )
      );
      toast.success("OTP Verified! Timer started. ⏱️");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to start job");
    }
  };

  /* =======================
     COMPLETE JOB
  ======================= */
  const completeJob = async (req, e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch("/services/complete", { requestId: req._id });
      setRequests((prev) =>
        prev.map((r) => r._id === req._id ? { ...r, status: "completed" } : r)
      );
      toast.success("Job marked complete! Payment request sent to customer. 🎉");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete job");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-blue-100 p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold text-slate-900">Service Requests</h1>
      </div>
      <p className="text-slate-600 mb-8">Nearby jobs available for you — updates arrive live</p>

      {loading && <p className="text-slate-500">Loading requests...</p>}
      {!loading && uniqueRequests.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg font-medium">No requests nearby right now</p>
          <p className="text-sm mt-1">New requests will appear automatically</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {uniqueRequests.map((req) => {
          const distance = providerLocation &&
            getDistanceInKm(providerLocation.lat, providerLocation.lng, req.location.lat, req.location.lng);

          const statusBadge = {
            open: "bg-emerald-100 text-emerald-700",
            assigned: "bg-indigo-100 text-indigo-700",
            in_progress: "bg-amber-100 text-amber-700",
            completed: "bg-slate-200 text-slate-700",
            cancelled: "bg-red-100 text-red-700",
          };

          return (
            <div
              key={req._id}
              className="group rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md hover:shadow-xl transition-all border border-white/50"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-slate-800 capitalize">{req.serviceType}</h2>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusBadge[req.status] || "bg-slate-100 text-slate-600"}`}>
                  {req.status.toUpperCase()}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{req.problemDescription}</p>

              <div className="mt-4 flex items-center justify-between text-sm">
                {typeof distance === "number" && (
                  <span className="text-indigo-600 font-medium flex items-center gap-1">
                    <MapPin size={14} /> {distance} km away
                  </span>
                )}
                {req.status === "in_progress" && req.startTime && (
                  <LiveTimer startTime={req.startTime} />
                )}
              </div>

              {/* Time remaining for open requests */}
              {req.status === "open" && req.expiresAt && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <Clock size={12} />
                  Expires: {new Date(req.expiresAt).toLocaleTimeString()}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-3 w-full">
                <div className="flex gap-2 w-full">
                  {/* Open — Accept / Reject */}
                  {req.status === "open" && (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={(e) => acceptJob(req, e)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white py-2.5 font-semibold hover:bg-indigo-700 transition"
                      >
                        <CheckCircle size={16} /> Accept
                      </button>
                      <button
                        onClick={(e) => rejectJob(req, e)}
                        className="flex items-center justify-center p-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition border border-rose-100"
                        title="Skip Request"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  )}

                  {/* Assigned — OTP flow */}
                  {req.status === "assigned" && (
                    <div className="flex-1 flex flex-col gap-2">
                      {!otpSentStatus[req._id] ? (
                        <button
                          onClick={(e) => triggerSendOTP(req._id, e)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white py-2.5 font-semibold hover:bg-orange-600 transition"
                        >
                          📧 Send OTP to Customer
                        </button>
                      ) : (
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Enter OTP"
                              maxLength={6}
                              value={otpInputs[req._id] || ""}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setOtpInputs({ ...otpInputs, [req._id]: e.target.value })}
                              className="w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-semibold tracking-widest outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              onClick={(e) => startJob(req, e)}
                              className="w-1/2 flex items-center justify-center gap-1 rounded-xl bg-emerald-600 text-white py-2.5 text-sm font-semibold hover:bg-emerald-700 transition"
                            >
                              <Play size={14} /> Verify & Start
                            </button>
                          </div>
                          <button
                            onClick={(e) => triggerSendOTP(req._id, e)}
                            className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider hover:text-indigo-800 text-left px-1"
                          >
                            Resend OTP
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* In Progress — End Job */}
                  {req.status === "in_progress" && (
                    <button
                      onClick={(e) => completeJob(req, e)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white py-2.5 font-semibold hover:bg-rose-700 transition"
                    >
                      🟥 End Job
                    </button>
                  )}

                  {/* Map link */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setMapLocation(req.location); }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-50 text-indigo-700 px-4 py-2.5 font-semibold hover:bg-indigo-100 transition"
                  >
                    <Navigation size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAP MODAL */}
      {mapLocation && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="relative bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setMapLocation(null)}
              className="absolute top-4 right-4 bg-white p-2 rounded-full shadow"
            >
              <X size={18} />
            </button>
            <iframe
              title="Map"
              width="100%"
              height="420"
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${mapLocation.lat},${mapLocation.lng}&z=15&output=embed`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
