import React, { useState } from "react";
import { X, AlertTriangle, Loader2, MapPin } from "lucide-react";
import api from "../config/api";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const EMERGENCY_OPTIONS = [
  { label: "Select Emergency Type...", value: "", type: "" },
  { label: "Electrical Short Circuit", value: "Electrical Short Circuit", type: "electrician" },
  { label: "Severe Water Leakage", value: "Severe Water Leakage", type: "plumber" },
  { label: "Door Jammed with Safety Risk", value: "Door Jammed with Safety Risk", type: "carpenter" },
  { label: "AC Smoke or Burning Smell", value: "AC Smoke or Burning Smell", type: "ac_technician" },
];

export default function SOSButton() {
  const user = useSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  // Only render for logged-in non-provider, non-admin users
  if (!user || user.role === "service_provider" || user.role === "admin") return null;

  const selectedOption = EMERGENCY_OPTIONS.find((o) => o.value === selected);

  const handleSubmit = async () => {
    if (!selectedOption?.type) {
      toast.error("Please select an emergency type.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setLoading(true);
        try {
          const { data } = await api.post("/services/sos-emergency", {
            serviceType: selectedOption.type,
            problemDescription: selectedOption.value,
            location,
          });
          toast.success(
            `🚨 SOS sent! ${data.notifiedPartners} nearby provider(s) alerted.`,
            { duration: 6000, style: { background: "#dc2626", color: "#fff", fontWeight: "bold" } }
          );
          setOpen(false);
          setSelected("");
        } catch (err) {
          toast.error(err?.response?.data?.message || "Failed to send SOS. Try again.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLocating(false);
        toast.error("Location access denied. Please enable GPS to use SOS.");
      },
      { timeout: 10000 }
    );
  };

  return (
    <>
      {/* Pulsing SOS Button — fixed top-left */}
      <button
        id="sos-emergency-btn"
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm px-4 py-2.5 rounded-full shadow-2xl transition-transform"
        style={{ animation: "sosPulse 1.8s ease-in-out infinite" }}
        aria-label="SOS Emergency Button"
      >
        <AlertTriangle size={18} className="fill-white" />
        SOS
      </button>

      {/* Pulse animation injection */}
      <style>{`
        @keyframes sosPulse {
          0%   { box-shadow: 0 0 0 0 rgba(220,38,38,0.7); }
          60%  { box-shadow: 0 0 0 14px rgba(220,38,38,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        }
      `}</style>

      {/* SOS Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Red header bar */}
            <div className="bg-red-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={28} className="text-white fill-white" />
                <div>
                  <h2 className="text-xl font-black text-white tracking-wide">Emergency Request</h2>
                  <p className="text-red-100 text-xs mt-0.5">Help is on its way. Stay calm.</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white transition"
                aria-label="Close SOS modal"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  What is your emergency?
                </label>
                <select
                  id="sos-problem-select"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
                >
                  {EMERGENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={!opt.type && opt.value === ""}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOption?.type && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  <MapPin size={14} className="flex-shrink-0" />
                  <span>Your live GPS location will be shared with a nearby <strong>{selectedOption.type.replace("_", " ")}</strong>.</span>
                </div>
              )}

              <button
                id="sos-submit-btn"
                onClick={handleSubmit}
                disabled={loading || locating || !selected}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-base py-3.5 transition active:scale-95"
              >
                {(loading || locating) ? (
                  <><Loader2 size={18} className="animate-spin" /> {locating ? "Getting your location..." : "Sending SOS..."}</>
                ) : (
                  <><AlertTriangle size={18} className="fill-white" /> SEND SOS NOW</>
                )}
              </button>

              <p className="text-center text-xs text-slate-400">
                Misuse of the SOS feature is a violation of Sahayak's terms and may result in account suspension.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
