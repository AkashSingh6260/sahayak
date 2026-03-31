import React, { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Send, MapPin, Sparkles, Wrench, X, IndianRupee, Zap } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import api from "../config/api.js";
import { getServicePricingDisplay, distanceCharges, getEstimatedRange, getServiceRate } from "../config/pricing.js";
import toast from "react-hot-toast";
import useWebSocket from "../hooks/useWebSocket.js";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const serviceImages = {
  plumber: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000",
  electrician: "https://images.unsplash.com/photo-1605152276897-4f618f831968?q=80&w=1000",
  ac: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000",
  painter: "https://images.unsplash.com/photo-1598300053652-6b0a9c35d5c2?q=80&w=1000",
};

const Broadcast = () => {
  const { serviceType: paramService } = useParams();
  const { state } = useLocation();
  const serviceType = (state?.serviceType || paramService)?.toLowerCase();

  const [description, setDescription] = useState("");
  const [listening, setListening] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [providerInfo, setProviderInfo] = useState(null);

  const pricing = getEstimatedRange(serviceType);
  const serviceRate = getServiceRate(serviceType);

  const { lang } = useLang();
  const t = translations[lang].broadcast;
  const tProf = translations[lang].professions;

  // WebSocket: listen for request_accepted event
  const handleWsMessage = useCallback((payload) => {
    if (payload.type === "request_accepted" && waiting) {
      setWaiting(false);
      setAccepted(true);
      setProviderInfo(payload.data);
      toast.success(payload.message, { duration: 6000 });
    }
  }, [waiting]);

  useWebSocket(handleWsMessage);

  useEffect(() => {
    if (!serviceType) toast.error(t.serviceTypeMissing || "Service type missing");
    else fetchLocation();
  }, [serviceType]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.lang = "en-IN";
      recog.onresult = (e) => {
        setDescription((prev) => prev + " " + e.results[0][0].transcript);
        setListening(false);
      };
      recog.onend = () => setListening(false);
      setRecognition(recog);
    }
  }, []);

  const startListening = () => {
    if (!recognition) return toast.error(t.speechNotSupported || "Speech not supported");
    setListening(true);
    recognition.start();
  };

  const fetchLocation = () => {
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoadingLocation(false);
      },
      () => {
        toast.error(t.locationDenied || "Location access denied");
        setLoadingLocation(false);
      }
    );
  };

  const handleBroadcast = () => {
    if (!description.trim()) return toast.error(t.describeProblemError || "Describe the problem");
    if (!location) return toast.error(t.shareLocationError || "Share your location");
    setShowConfirm(true);
  };

  const confirmBroadcast = async () => {
    try {
      setSubmitting(true);
      const { data } = await api.post("/services", {
        serviceType,
        problemDescription: description,
        location,
      });
      toast.success(t.broadcasted || "📢 Request broadcasted to nearby professionals!");
      setShowConfirm(false);
      setActiveRequestId(data.service?._id);
      setWaiting(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Broadcast failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRequestId) { setWaiting(false); return; }
    try {
      setCancelling(true);
      await api.patch("/services/cancel", { requestId: activeRequestId });
      toast.success(t.cancelled || "Request cancelled.");
      setWaiting(false);
      setActiveRequestId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      {/* HERO */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <img
          src={serviceImages[serviceType] || "https://images.unsplash.com/photo-1521791136064-7986c2920216"}
          alt={serviceType}
          className="w-full h-full object-cover scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-indigo-900/40 flex items-center justify-center">
          <div className="text-white text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20">
              <Sparkles size={16} />
              <span className="text-sm">{t.quickService}</span>
            </div>
            <h1 className="text-4xl font-bold capitalize mt-3">{tProf[serviceType]?.label || serviceType} {t.service}</h1>
            <p className="text-sm text-white/80 max-w-md">
              {t.describeIssue}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-100 flex justify-center px-4 py-12 -mt-28">
        <div className="bg-white/95 backdrop-blur-xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.25)] rounded-3xl p-8 w-full max-w-xl border border-indigo-100">

          {/* Service Badge & Price */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 px-4 py-2 rounded-full border">
              <Wrench size={16} />
              <span className="font-semibold capitalize">{tProf[serviceType]?.label || serviceType}</span>
            </div>
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-sm shadow-sm flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Est: {getServicePricingDisplay(serviceType)}
            </div>
          </div>

          {/* Description */}
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.describeProblem}
              className="w-full min-h-[150px] rounded-2xl p-5 pr-16 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
            />
            <button
              onClick={listening ? () => recognition.stop() : startListening}
              className={`absolute bottom-4 right-4 p-3 rounded-full shadow-lg transition-all ${listening ? "bg-red-500 animate-pulse" : "bg-indigo-600 hover:scale-110"
                } text-white`}
            >
              {listening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          </div>

          {/* Location Card */}
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <MapPin size={18} className="text-indigo-600" />
              {t.yourLocation}
            </div>
            {location ? (
              <p className="text-sm text-slate-700 mt-1">
                📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            ) : (
              <p className="text-sm text-slate-500 mt-1">{t.locationNotShared}</p>
            )}
            <button
              onClick={fetchLocation}
              disabled={loadingLocation}
              className="mt-4 w-full rounded-xl border border-indigo-600 text-indigo-600 py-2.5 font-semibold hover:bg-indigo-50 transition"
            >
              {loadingLocation ? t.fetchingLocation : t.useCurrentLocation}
            </button>
          </div>

          {/* Pricing Breakdown Card */}
          <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-800 mb-3">
              <IndianRupee size={18} className="text-indigo-600" />
              {t.pricingBreakdown}
            </div>

            {/* Service charge */}
            <div className="flex justify-between text-sm text-slate-700 py-2 border-b border-blue-100">
              <span>
                {t.serviceCharge}
                {serviceRate.type === "hourly" && <span className="text-xs text-slate-400 ml-1">({t.perHr})</span>}
              </span>
              <span className="font-semibold text-slate-900">
                {serviceRate.type === "fixed" ? `₹${serviceRate.price} ${t.fixed}` : `₹${serviceRate.rate}/hr`}
              </span>
            </div>

            {/* Distance charges table */}
            <div className="mt-2">
              <p className="text-xs font-medium text-slate-500 mb-1.5">+ {t.distanceCharge}</p>
              <div className="grid grid-cols-2 gap-1">
                {distanceCharges.map((d) => (
                  <div key={d.label} className="flex justify-between text-xs text-slate-600 bg-white/70 rounded-lg px-3 py-1.5">
                    <span>{d.label}</span>
                    <span className="font-semibold">₹{d.charge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform fee note */}
            {/*<div className="mt-3 flex justify-between text-sm text-slate-600 py-2 border-t border-blue-100">
              <span className="flex items-center gap-1"><Zap size={14} className="text-amber-500" /> Platform Fee</span>
              <span className="font-semibold text-amber-600">20% of total</span>
            </div>

            <div className="mt-2 rounded-xl bg-indigo-600 text-white text-center py-2 text-sm font-bold">
              Est. Total: ₹{pricing.minTotal} – ₹{pricing.maxTotal + Math.round(pricing.maxTotal * 0.20)}
            </div>*/}
          </div>

          {/* Broadcast Button */}
          <button
            onClick={handleBroadcast}
            className="mt-7 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 rounded-2xl font-semibold shadow-lg hover:opacity-95 transition"
          >
            <Send size={18} />
            {t.broadcastBtn}
          </button>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl border">
            <h3 className="text-xl font-semibold mb-2">{t.confirmBroadcast}</h3>
            <p className="text-sm text-slate-600 mb-5">
              {t.confirmDesc}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full border py-2.5 rounded-xl hover:bg-gray-50 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={confirmBroadcast}
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold"
              >
                {submitting ? t.broadcasting : t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WAITING OVERLAY */}
      {waiting && (
        <div className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl w-full max-w-sm mx-4">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-lg font-semibold mb-1">{t.finding} {tProf[serviceType]?.label || serviceType}...</h3>
            <p className="text-sm text-gray-500 mb-6">{t.pleaseWait}</p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center justify-center gap-2 mx-auto text-sm text-red-500 font-semibold border border-red-200 px-5 py-2 rounded-full hover:bg-red-50 transition"
            >
              <X size={16} />
              {cancelling ? t.cancelling : t.cancelRequest}
            </button>
          </div>
        </div>
      )}

      {/* ACCEPTED OVERLAY */}
      {accepted && (
        <div className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl w-full max-w-sm mx-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">{t.accepted}</h3>
            {providerInfo?.providerName && (
              <p className="text-slate-600 text-sm mt-2">
                <b>{providerInfo.providerName}</b> {t.onTheWay}
                {providerInfo.providerPhone && (
                  <span> {t.call} <a href={`tel:${providerInfo.providerPhone}`} className="text-indigo-600 font-bold">{providerInfo.providerPhone}</a></span>
                )}
              </p>
            )}
            <button
              onClick={() => setAccepted(false)}
              className="mt-6 w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold"
            >
              {t.gotIt}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Broadcast;
