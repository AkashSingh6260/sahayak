import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, MapPin, Phone, Briefcase,
  TrendingUp, Users, Search, RefreshCw, AlertTriangle, X, ExternalLink,
  IndianRupee, BarChart2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "../config/api";
import toast from "react-hot-toast";
import useWebSocket from "../hooks/useWebSocket";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

// ── helpers ───────────────────────────────────────────────────────────────────
const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const calcDelta = (series, key) => {
  if (!Array.isArray(series) || series.length < 2) return null;
  const last = Number(series.at(-1)?.[key] ?? 0);
  const prev = Number(series.at(-2)?.[key] ?? 0);
  if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) return null;
  return { pct: ((last - prev) / Math.abs(prev)) * 100 };
};

const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

const AVATAR_PALETTE = [
  ["#fde68a", "#92400e"], ["#a7f3d0", "#065f46"], ["#c7d2fe", "#3730a3"],
  ["#fecaca", "#991b1b"], ["#bae6fd", "#0c4a6e"], ["#d9f99d", "#365314"],
  ["#fbcfe8", "#831843"], ["#e9d5ff", "#581c87"],
];

const getAvatarStyle = (name = "") => {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  const [bg, color] = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return { backgroundColor: bg, color };
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const Avatar = ({ name, size = "md" }) => {
  const sz = size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs";
  return (
    <div
      style={getAvatarStyle(name)}
      className={`shrink-0 ${sz} rounded-full flex items-center justify-center font-bold ring-2 ring-white`}
    >
      {getInitials(name) || "?"}
    </div>
  );
};

// ── Reject Modal ──────────────────────────────────────────────────────────────
const RejectModal = ({ partner, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-rose-100">
        <div className="flex items-start gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Reject Application</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Rejecting <strong className="text-rose-600">{partner?.fullName}</strong>'s application.
            </p>
          </div>
        </div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Reason <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          autoFocus rows={3} value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Incomplete documents, unverified proof..."
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 resize-none"
        />
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onConfirm(reason || "Not specified")}
            className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 py-2.5 text-sm font-bold text-white hover:from-rose-600 hover:to-rose-700 transition shadow-sm"
          >
            Confirm Rejection
          </button>
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    approved: { label: "Approved", bg: "bg-emerald-500", text: "text-white", icon: <CheckCircle size={11} /> },
    rejected: { label: "Rejected", bg: "bg-rose-500",    text: "text-white", icon: <XCircle size={11} /> },
    pending:  { label: "Pending",  bg: "bg-amber-400",   text: "text-white", icon: <Clock size={11} /> },
  };
  const { label, bg, text, icon } = map[status] || { label: status, bg: "bg-slate-200", text: "text-slate-600" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${bg} ${text}`}>
      {icon} {label}
    </span>
  );
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ cls }) => <div className={`animate-pulse rounded-lg bg-white/20 ${cls}`} />;
const SkLight = ({ cls }) => <div className={`animate-pulse rounded-lg bg-slate-100 ${cls}`} />;

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ gradient, icon, label, value, sub, loading, textLight }) => (
  <div className={`rounded-2xl p-5 bg-gradient-to-br ${gradient} shadow-lg relative overflow-hidden`}>
    {/* Decorative circle */}
    <div className="absolute -top-5 -right-5 h-24 w-24 rounded-full bg-white/10" />
    <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />
    <div className="relative">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 mb-3">
        {icon}
      </div>
      <p className={`text-xs font-semibold uppercase tracking-wider ${textLight ? "text-white/70" : "text-white/80"}`}>{label}</p>
      {loading
        ? <Sk cls="h-8 w-32 mt-1.5" />
        : <p className="text-3xl font-extrabold text-white mt-1 tracking-tight">{value}</p>
      }
      {sub && !loading && (
        <p className="text-xs text-white/70 mt-1.5 font-medium">{sub}</p>
      )}
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { lang } = useLang();
  const t = translations[lang].adminDash;

  const [partners, setPartners]               = useState([]);
  const [filter, setFilter]                   = useState("all");
  const [loading, setLoading]                 = useState(true);
  const [stats, setStats]                     = useState({ totalPlatformRevenue: 0, totalBusinessVolume: 0, approved: 0, pending: 0, total: 0 });
  const [revenueData, setRevenueData]         = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [actionLoading, setActionLoading]     = useState(null);
  const [query, setQuery]                     = useState("");
  const [rejectTarget, setRejectTarget]       = useState(null);
  const [lastRefresh, setLastRefresh]         = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [appRes, statsRes] = await Promise.all([
        api.get("/admin/applications"),
        api.get("/admin/dashboard-stats"),
      ]);
      setPartners(appRes.data.applications || []);
      setStats(statsRes.data.stats);
      setRevenueData(statsRes.data.revenueData || []);
      setServiceBreakdown(statsRes.data.serviceBreakdown || []);
      setLastRefresh(new Date());
    } catch {
      toast.error(t.errorLoad);
    } finally {
      setLoading(false);
    }
  }, [t.errorLoad]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useWebSocket(useCallback((payload) => {
    if (["payment_received", "service_completed", "application_approved", "application_rejected"].includes(payload.type)) {
      fetchData();
    }
  }, [fetchData]));

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/applications/${id}`, { status: "approved" });
      toast.success(t.successUpdate);
      fetchData();
    } catch {
      toast.error(t.errorUpdate);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    const id = rejectTarget._id;
    setRejectTarget(null);
    setActionLoading(id);
    try {
      await api.patch(`/admin/applications/${id}`, { status: "rejected", rejectionReason: reason });
      toast.success(t.successUpdate);
      fetchData();
    } catch {
      toast.error(t.errorUpdate);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners
      .filter((p) => filter === "all" || p.status === filter)
      .filter((p) => {
        if (!q) return true;
        return [p.fullName, p.workType, p.phone, p.email, p.location?.address, typeof p.location === "string" ? p.location : ""]
          .filter(Boolean).join(" ").toLowerCase().includes(q);
      });
  }, [partners, query, filter]);

  const revenueDelta = useMemo(() => calcDelta(revenueData, "revenue"), [revenueData]);
  const approvalRate = useMemo(() => {
    const total = Number(stats?.total || 0);
    const approved = Number(stats?.approved || 0);
    return total ? ((approved / total) * 100).toFixed(0) : null;
  }, [stats]);

  const counts = useMemo(() => ({
    all:      partners.length,
    pending:  partners.filter((p) => p.status === "pending").length,
    approved: partners.filter((p) => p.status === "approved").length,
    rejected: partners.filter((p) => p.status === "rejected").length,
  }), [partners]);

  const refreshLabel = useMemo(() => {
    const diff = Math.floor((new Date() - lastRefresh) / 1000);
    if (diff < 60)   return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRefresh, loading]);

  // Filter pill config
  const filterConfig = {
    all:      { active: "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md", inactive: "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700" },
    pending:  { active: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md", inactive: "text-slate-600 hover:bg-amber-50 hover:text-amber-700" },
    approved: { active: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md", inactive: "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700" },
    rejected: { active: "bg-gradient-to-r from-rose-400 to-rose-600 text-white shadow-md",   inactive: "text-slate-600 hover:bg-rose-50 hover:text-rose-600" },
  };

  return (
    <>
      {rejectTarget && (
        <RejectModal
          partner={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)" }}>

        {/* ── Colorful Header ── */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                <BarChart2 size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Sahayak Platform</p>
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {t.heading || "Admin Dashboard"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700">Live · {refreshLabel}</span>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-bold text-white hover:from-indigo-600 hover:to-violet-600 transition shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                {t.refresh || "Refresh"}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-7 space-y-6">

          {/* ── Colorful Stat Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              gradient="from-indigo-500 via-indigo-600 to-violet-700"
              icon={<IndianRupee size={18} className="text-white" />}
              label={t.platformRevenue || "Platform Revenue"}
              value={formatCurrency(stats?.totalPlatformRevenue || 0)}
              sub={revenueDelta ? `${revenueDelta.pct >= 0 ? "▲" : "▼"} ${Math.abs(revenueDelta.pct).toFixed(1)}% vs last period` : "vs last period"}
              loading={loading}
            />
            <StatCard
              gradient="from-sky-400 via-blue-500 to-blue-600"
              icon={<TrendingUp size={18} className="text-white" />}
              label={t.totalBizVolume || "Business Volume"}
              value={formatCurrency(stats?.totalBusinessVolume || 0)}
              sub="Total transacted"
              loading={loading}
            />
            <StatCard
              gradient="from-emerald-400 via-teal-500 to-cyan-600"
              icon={<Users size={18} className="text-white" />}
              label={t.approvedPartners || "Active Partners"}
              value={String(stats?.approved || 0)}
              sub={approvalRate ? `${approvalRate}% approval rate` : "approval rate"}
              loading={loading}
            />
            <StatCard
              gradient="from-amber-400 via-orange-500 to-rose-500"
              icon={<Clock size={18} className="text-white" />}
              label={t.pendingApprovals || "Awaiting Review"}
              value={String(stats?.pending || 0)}
              sub="need your action"
              loading={loading}
            />
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Revenue Line Chart */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">{t.revenueTrend || "Revenue Trend"}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Monthly platform earnings</p>
                </div>
                <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-full px-3 py-1">
                  <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-xs font-semibold text-violet-600">Live</span>
                </div>
              </div>
              {loading ? (
                <SkLight cls="h-56 w-full" />
              ) : revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={224}>
                  <LineChart data={revenueData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      formatter={(v) => [`₹${v}`, "Revenue"]}
                      contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="url(#revGrad)" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <TrendingUp size={22} className="text-indigo-400" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">No revenue data yet</p>
                </div>
              )}
            </div>

            {/* Pie Chart */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm p-6">
              <h2 className="font-bold text-slate-900 text-base">{t.serviceBreakdown || "By Service"}</h2>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">Request distribution</p>
              {loading ? (
                <SkLight cls="h-56 w-full" />
              ) : serviceBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={224}>
                  <PieChart>
                    <Pie data={serviceBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3} stroke="none">
                      {serviceBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center gap-2">
                  <div className="h-12 w-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                    <BarChart2 size={22} className="text-violet-400" />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">No category data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Applications Table ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">

            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="font-bold text-slate-900 text-base">{t.partnerApps || "Partner Applications"}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing <span className="font-semibold text-indigo-600">{filtered.length}</span> of {partners.length} total
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Colorful filter pills */}
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {["all", "pending", "approved", "rejected"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all duration-200 ${
                        filter === f ? filterConfig[f].active : filterConfig[f].inactive
                      }`}
                    >
                      {t[f] || f}
                      <span className={`rounded-full px-1.5 py-px text-[10px] font-extrabold ${
                        filter === f ? "bg-white/30" : "bg-slate-200 text-slate-600"
                      }`}>
                        {counts[f]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-8 pr-7 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 w-40 bg-white"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <SkLight cls="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <SkLight cls="h-4 w-44" />
                      <SkLight cls="h-3 w-28" />
                    </div>
                    <SkLight cls="h-6 w-20 rounded-full" />
                    <SkLight cls="h-8 w-28 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex h-14 w-14 rounded-2xl bg-indigo-50 items-center justify-center mb-3">
                  <Search size={24} className="text-indigo-400" />
                </div>
                <p className="text-slate-700 font-semibold">No applications found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {query ? "Try a different search term" : "Submitted applications will show up here"}
                </p>
                {query && (
                  <button onClick={() => setQuery("")} className="mt-3 text-sm text-indigo-600 font-semibold underline underline-offset-2">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-100 text-left">
                      <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Exp.</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Docs</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((app, idx) => {
                      const rowBg =
                        app.status === "approved" ? "hover:bg-emerald-50/40" :
                        app.status === "rejected" ? "hover:bg-rose-50/40" :
                        "hover:bg-indigo-50/30";
                      return (
                        <tr key={app._id} className={`transition-colors ${rowBg}`}>

                          {/* Applicant */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={app.fullName} />
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{app.fullName || "N/A"}</p>
                                <p className="text-xs text-indigo-500 font-medium capitalize mt-0.5">{app.workType || "N/A"}</p>
                              </div>
                            </div>
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2 text-slate-700">
                              <div className="h-5 w-5 rounded-md bg-sky-100 flex items-center justify-center shrink-0">
                                <Phone size={11} className="text-sky-600" />
                              </div>
                              <span className="text-sm">{app.phone || "N/A"}</span>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2 text-slate-600">
                              <div className="h-5 w-5 rounded-md bg-rose-100 flex items-center justify-center shrink-0">
                                <MapPin size={11} className="text-rose-500" />
                              </div>
                              <span className="text-xs max-w-[140px] truncate">
                                {app.location?.lat
                                  ? `${app.location.lat.toFixed(3)}, ${app.location.lng.toFixed(3)}`
                                  : app.location?.address || app.location || "N/A"}
                              </span>
                            </div>
                          </td>

                          {/* Experience */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2 text-slate-700">
                              <div className="h-5 w-5 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                                <Briefcase size={11} className="text-amber-600" />
                              </div>
                              <span className="text-sm font-medium">{app.experience || 0} {t.yearsExp || "yrs"}</span>
                            </div>
                          </td>

                          {/* Docs */}
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1.5">
                              <a
                                href={app.idProofUrl || "#"}
                                onClick={(e) => { if (!app.idProofUrl) e.preventDefault(); }}
                                target="_blank" rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 text-xs rounded-lg px-2.5 py-1 font-bold transition ${
                                  app.idProofUrl
                                    ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                                    : "bg-slate-50 text-slate-300 cursor-not-allowed"
                                }`}
                              >
                                ID <ExternalLink size={10} />
                              </a>
                              <a
                                href={app.skillProofUrl || "#"}
                                onClick={(e) => { if (!app.skillProofUrl) e.preventDefault(); }}
                                target="_blank" rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 text-xs rounded-lg px-2.5 py-1 font-bold transition ${
                                  app.skillProofUrl
                                    ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                                    : "bg-slate-50 text-slate-300 cursor-not-allowed"
                                }`}
                              >
                                Skill <ExternalLink size={10} />
                              </a>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <StatusBadge status={app.status} />
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right">
                            {app.status === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleApprove(app._id)}
                                  disabled={actionLoading === app._id}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-3.5 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-600 transition shadow-sm disabled:opacity-50"
                                >
                                  <CheckCircle size={13} /> {t.approve || "Approve"}
                                </button>
                                <button
                                  onClick={() => setRejectTarget(app)}
                                  disabled={actionLoading === app._id}
                                  className="inline-flex items-center gap-1.5 rounded-xl border-2 border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-400 transition disabled:opacity-50"
                                >
                                  <XCircle size={13} /> {t.reject || "Reject"}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-200 text-xs font-bold">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
