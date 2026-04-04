import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  MapPin, FileText, CheckCircle, X, Navigation, Clock, Play
} from "lucide-react";
import api from "../../config/api.js";
import useWebSocket from "../../hooks/useWebSocket.js";
import toast from "react-hot-toast";
import { useLang } from "../../context/LanguageContext.jsx";
import translations from "../../context/translations.js";

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
  const [reportingFake, setReportingFake] = useState({});

  /* =======================
     AUDIO — Unlock on first user gesture to bypass browser autoplay policy
  ======================= */
  const alarmRef = useRef(null);
  const audioUnlocked = useRef(false);

  useEffect(() => {
    // Create the Audio object once, pointing at /alarm.mp3 in public folder
    alarmRef.current = new Audio("/alarm.mp3");
    alarmRef.current.preload = "auto";

    const unlock = () => {
      if (audioUnlocked.current) return;
      // Play silently (volume 0) to satisfy browser autoplay policy
      alarmRef.current.volume = 0;
      alarmRef.current.play()
        .then(() => {
          alarmRef.current.pause();
          alarmRef.current.currentTime = 0;
          alarmRef.current.volume = 1; // restore full volume
          audioUnlocked.current = true;
          console.log("🔊 Audio context unlocked");
        })
        .catch(() => {}); // ignore if it still fails
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const playAlarm = useCallback(() => {
    if (!alarmRef.current) return;
    alarmRef.current.currentTime = 0;
    alarmRef.current.volume = 1;
    alarmRef.current.play().catch((err) => {
      console.warn("Alarm play blocked (user hasn't interacted yet):", err.message);
    });
  }, []);

  const { lang } = useLang();
  const t = translations[lang].providerReq;

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
      toast(t.newRequest, { icon: "🔔", duration: 4000 });
      fetchRequests(); // refresh list
    }
    if (payload.type === "request_cancelled") {
      const cancelledId = payload.data?.requestId?.toString();
      setRequests((prev) => prev.filter((r) => r._id.toString() !== cancelledId));
      toast(t.requestCancelled, { icon: "❌" });
    }
    if (payload.type === "sos_request_alert") {
      // Play alarm via pre-unlocked audio ref
      playAlarm();

      // Fire a sticky, highly visible red toast
      toast.error(
        `🚨 URGENT SOS: ${payload.message}`,
        {
          duration: 15000,
          style: {
            background: "#dc2626",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "14px",
            borderRadius: "12px",
          },
        }
      );
      fetchRequests();
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
      toast.success(t.jobAccepted, {
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
    if (!window.confirm(t.skipConfirm)) return;
    try {
      await api.patch("/services/reject", { requestId: req._id });
      // Remove from local list only
      setRequests((prev) => prev.filter((r) => r._id !== req._id));
      toast(t.requestSkipped, { icon: "👋" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to skip");
    }
  };

  /* =======================
     SEND OTP
  ======================= */
  const triggerSendOTP = async (reqId, e) => {
    e.stopPropagation();
    const tid = toast.loading(t.otpSending);
    try {
      await api.patch("/services/send-otp", { requestId: reqId });
      toast.success(t.otpSent, { id: tid });
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
    if (!otp || otp.length < 6) return toast.error(t.otpInvalid);
    try {
      await api.patch("/services/start", { requestId: req._id, otp });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === req._id ? { ...r, status: "in_progress", startTime: new Date() } : r
        )
      );
      toast.success(t.otpVerified);
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
      toast.success(t.jobComplete);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to complete job");
    }
  };

  /* =======================
     REPORT FAKE SOS
  ======================= */
  const handleReportFakeSOS = async (req, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure this is a fake emergency? The user will be reported to Admins and this request will be terminated immediately.")) return;
    setReportingFake((prev) => ({ ...prev, [req._id]: true }));
    try {
      await api.post("/services/report-fake-sos", { requestId: req._id });
      toast.success("Fake SOS reported. Request terminated and admins notified.", {
        duration: 6000,
        style: { background: "#dc2626", color: "#fff", fontWeight: "bold" },
      });
      setRequests((prev) => prev.filter((r) => r._id !== req._id));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to report fake SOS.");
    } finally {
      setReportingFake((prev) => ({ ...prev, [req._id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-blue-100 p-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold text-slate-900">{t.heading}</h1>
      </div>
      <p className="text-slate-600 mb-8">{t.subheading}</p>

      {loading && <p className="text-slate-500">{t.loading}</p>}
      {!loading && uniqueRequests.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg font-medium">{t.noRequests}</p>
          <p className="text-sm mt-1">{t.appearAuto}</p>
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
              className={`group rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md hover:shadow-xl transition-all border ${
                req.isEmergency
                  ? "border-red-400 shadow-red-200 ring-2 ring-red-400 ring-offset-1"
                  : "border-white/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-slate-800 capitalize flex items-center gap-2">
                  {req.isEmergency && (
                    <span className="inline-flex items-center gap-1 text-xs font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                      🚨 SOS
                    </span>
                  )}
                  {req.serviceType}
                </h2>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusBadge[req.status] || "bg-slate-100 text-slate-600"}`}>
                  {req.status.toUpperCase()}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-600 line-clamp-2">{req.problemDescription}</p>

              <div className="mt-4 flex items-center justify-between text-sm">
                {typeof distance === "number" && (
                  <span className="text-indigo-600 font-medium flex items-center gap-1">
                    <MapPin size={14} /> {distance} {t.away}
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
                  {t.expires} {new Date(req.expiresAt).toLocaleTimeString()}
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
                        <CheckCircle size={16} /> {t.accept}
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
                          📧 {t.sendOtp}
                        </button>
                      ) : (
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder={t.enterOtp}
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
                              <Play size={14} /> {t.verifyStart}
                            </button>
                          </div>
                          <button
                            onClick={(e) => triggerSendOTP(req._id, e)}
                            className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider hover:text-indigo-800 text-left px-1"
                          >
                            {t.resendOtp}
                          </button>
                        </div>
                      )}

                      {/* Fake SOS report button — only for emergency requests */}
                      {req.isEmergency && (
                        <button
                          id={`fake-sos-btn-${req._id}`}
                          onClick={(e) => handleReportFakeSOS(req, e)}
                          disabled={reportingFake[req._id]}
                          className="w-full mt-1 rounded-xl border-2 border-red-500 text-red-600 bg-red-50 hover:bg-red-100 py-2 text-sm font-semibold disabled:opacity-50 transition"
                        >
                          {reportingFake[req._id] ? "Reporting..." : "🚩 Report Fake SOS"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* In Progress — End Job */}
                  {req.status === "in_progress" && (
                    <button
                      onClick={(e) => completeJob(req, e)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white py-2.5 font-semibold hover:bg-rose-700 transition"
                    >
                      🟥 {t.endJob}
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
