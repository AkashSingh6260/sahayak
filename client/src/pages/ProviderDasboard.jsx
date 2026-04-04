import React, { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import {
  TrendingUp, CheckCircle, Clock, Wallet, Star, MapPin, Loader2, IndianRupee
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../config/api";
import useWebSocket from "../hooks/useWebSocket.js";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const COLORS = ["#22c55e", "#facc15", "#ef4444", "#94a3b8"];
const GWALIOR_LOCATIONS = [
  { name: "Pinto Park, Gwalior", lat: 26.2465, lng: 78.2255 },
  { name: "Gole Ka Mandir, Gwalior", lat: 26.2429, lng: 78.2123 },
  { name: "Indramani Nagar, Gole Ka Mandir, Gwalior", lat: 26.2227, lng: 78.2035 },
  { name: "Govindpuri, Gwalior", lat: 26.2062, lng: 78.2036 },
  { name: "Hazira, Gwalior", lat: 26.2308, lng: 78.1828 },
  { name: "Shinde Ki Chawani, Gwalior", lat: 26.2067, lng: 78.1618 },
  { name: "Deendayal Nagar (DD Nagar), Gwalior", lat: 26.2575, lng: 78.2258 },
];

const ProviderDashboard = () => {
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [storedLocation, setStoredLocation] = useState(null);

  const [liveStats, setLiveStats] = useState({
    totalJobs: 0, completedJobs: 0, pendingJobs: 0, totalEarnings: 0, avgRating: 0, walletBalance: 0
  });
  const [earningsData, setEarningsData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [ratingData, setRatingData] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/services/stats");
      setLiveStats(data.stats);
      setEarningsData(data.earningsData || []);
      setStatusData(data.statusData || []);
      setRatingData(data.ratingDistribution || []);
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/partners/me");
      if (data.partner?.location) setStoredLocation(data.partner.location);
    } catch (err) { }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [fetchProfile, fetchStats]);

  // Refresh live stats when a payment arrives or job completes
  const handleWsMessage = useCallback((payload) => {
    if (["payment_received", "service_completed", "new_request", "rating_received"].includes(payload.type)) {
      fetchStats();
    }
    if (payload.type === "fake_sos_alert") {
      toast.error(
        payload.message,
        {
          duration: 20000,
          style: {
            background: "#7f1d1d",
            color: "#fef2f2",
            fontWeight: "bold",
            fontSize: "13px",
            borderRadius: "12px",
            maxWidth: "480px",
          },
        }
      );
    }
  }, [fetchStats]);

  useWebSocket(handleWsMessage);

  const { lang } = useLang();
  const t = translations[lang].providerDash;

  const displayStats = [
    { title: t.totalRequests, value: liveStats.totalJobs, icon: TrendingUp, color: "blue" },
    { title: t.completed, value: liveStats.completedJobs, icon: CheckCircle, color: "emerald" },
    { title: t.pending, value: liveStats.pendingJobs, icon: Clock, color: "amber" },
    { title: t.totalEarnings, value: `₹${liveStats.totalEarnings.toLocaleString()}`, icon: IndianRupee, color: "indigo" },
  ];

  const filteredLocations = GWALIOR_LOCATIONS.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error(t.geoNotSupported);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setSelectedLat(lat); setSelectedLng(lng);
        setSearchQuery(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        toast.success(t.locationDetected);
        setLocating(false);
      },
      () => { toast.error(t.geoError); setLocating(false); }
    );
  };

  const handleUpdateLocation = async () => {
    if (!selectedLat || !selectedLng) return toast.error(t.selectLocation);
    try {
      setUpdatingLocation(true);
      const { data } = await api.put("/partners/location", { lat: selectedLat, lng: selectedLng });
      toast.success(t.locationUpdated);
      setStoredLocation(data.location);
      setSearchQuery(""); setSelectedLat(null); setSelectedLng(null);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t.locationUpdateFailed);
    } finally {
      setUpdatingLocation(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-blue-100 p-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">{t.heading}</h1>
          <p className="mt-1 text-slate-600">{t.subheading}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-6">
        {/* Wallet Balance Card - takes 2 cols */}
        <div className="xl:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 shadow-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 font-medium">{t.walletBalance}</p>
              <h3 className="mt-2 text-4xl font-bold">₹{liveStats.walletBalance.toLocaleString()}</h3>
            </div>
            <div className="rounded-xl p-3 bg-white/20 backdrop-blur">
              <Wallet size={28} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-indigo-100">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {t.liveSync}
          </div>
        </div>

        {/* Top Stats */}
        {displayStats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md hover:shadow-xl transition border border-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{item.title}</p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-900">{item.value}</h3>
                </div>
                <div className={`rounded-xl p-3 bg-${item.color}-100 text-${item.color}-600`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Location Card */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md border border-white flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-indigo-600" /> {t.serviceLocation}
            </h3>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition">
                ✏️ {t.edit}
              </button>
            )}
          </div>

          <div className="flex-1">
            {!isEditing ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                <MapPin size={18} className="text-indigo-400 flex-shrink-0" />
                {storedLocation ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{storedLocation.lat.toFixed(5)}, {storedLocation.lng.toFixed(5)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.storedCoords}</p>
                  </div>
                ) : <p className="text-sm text-slate-400 italic">{t.noLocation}</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text" placeholder={t.searchArea} value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedLat(null); setSelectedLng(null); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {showSuggestions && searchQuery.length > 0 && filteredLocations.length > 0 && (
                  <ul className="rounded-xl border border-indigo-100 bg-white shadow-lg overflow-y-auto max-h-40">
                    {filteredLocations.map((loc, idx) => (
                      <li key={idx} onMouseDown={(e) => { e.preventDefault(); setSearchQuery(loc.name); setSelectedLat(loc.lat); setSelectedLng(loc.lng); setShowSuggestions(false); }} className="cursor-pointer px-4 py-2 text-sm hover:bg-indigo-50 border-b last:border-none">
                        <div className="font-medium">{loc.name}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={useCurrentLocation} disabled={locating} className="w-full text-sm font-medium text-indigo-700 bg-indigo-50 py-2 rounded-xl hover:bg-indigo-100 flex items-center justify-center gap-2">
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin size={16} />} {t.useAutoDetect}
                </button>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsEditing(false)} className="flex-1 rounded-xl border py-2 text-sm font-semibold hover:bg-slate-50">{t.cancel}</button>
                  <button onClick={handleUpdateLocation} disabled={updatingLocation || !selectedLat} className="flex-1 rounded-xl bg-indigo-600 text-white py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">{t.save}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating Card */}
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-100 p-6 shadow-md border border-amber-200 flex flex-col justify-center items-center text-center">
          <p className="text-lg font-medium text-slate-700">{t.avgRating}</p>
          <div className="flex items-end gap-2 my-4">
            <h3 className="text-6xl font-black text-amber-600">{liveStats.avgRating || t.new}</h3>
            <span className="text-xl text-amber-500 font-bold mb-1">/ 5</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={28} className={i <= Math.floor(liveStats.avgRating || 0) ? "text-amber-500 fill-amber-500" : "text-amber-200"} />
            ))}
          </div>
          <p className="text-sm mt-4 text-amber-700 font-medium">{t.basedOn} {liveStats.totalJobs} {t.completedJobs}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md border border-white">
          <h3 className="mb-6 text-lg font-bold text-slate-800">{t.earningsTrend}</h3>
          {earningsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip cursor={{ fill: "#f1f5f9" }} formatter={(val) => [`₹${val}`, "Earnings"]} />
                <Line type="monotone" dataKey="earnings" stroke="#4f46e5" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-slate-400">{t.noEarnings}</div>
          )}
        </div>

        {/* Status Pie */}
        <div className="rounded-2xl bg-white/80 backdrop-blur p-6 shadow-md border border-white">
          <h3 className="mb-4 text-lg font-bold text-slate-800">{t.jobStatus}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} label={false}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>{s.name}
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default ProviderDashboard;

