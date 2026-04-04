import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Briefcase,
  TrendingUp,
  Users,
  Search,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../config/api";
import toast from "react-hot-toast";
import useWebSocket from "../hooks/useWebSocket";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const COLORS = ["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6"];

const cx = (...classes) => classes.filter(Boolean).join(" ");

const formatCurrency = (value) => {
  const n = Number(value || 0);
  return `₹${n.toLocaleString("en-IN")}`;
};

const calcDeltaPct = (series, key) => {
  if (!Array.isArray(series) || series.length < 2) return null;
  const last = Number(series[series.length - 1]?.[key] ?? 0);
  const prev = Number(series[series.length - 2]?.[key] ?? 0);
  if (!Number.isFinite(last) || !Number.isFinite(prev) || prev === 0) return null;
  const pct = ((last - prev) / Math.abs(prev)) * 100;
  return { pct, up: pct >= 0 };
};

const Skeleton = ({ className }) => (
  <div className={cx("animate-pulse rounded-2xl bg-slate-200/70", className)} />
);

const EmptyState = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
      <Sparkles size={22} />
    </div>
    <div className="max-w-md">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
    {action}
  </div>
);

const KpiCard = ({
  title,
  value,
  icon,
  tone = "neutral",
  delta,
  subtitle,
  loading,
}) => {
  const theme =
    tone === "brand"
      ? {
          wrap: "bg-gradient-to-br from-indigo-600 to-blue-700 text-white border-transparent shadow-lg",
          label: "text-indigo-100",
          value: "text-white",
          deltaUp: "bg-white/15 text-white",
          deltaDown: "bg-rose-50 text-rose-700",
          iconWrap: "bg-white/15 text-white",
        }
      : tone === "success"
      ? {
          wrap: "bg-white border-emerald-100 text-slate-900",
          label: "text-emerald-600",
          value: "text-slate-900",
          deltaUp: "bg-emerald-50 text-emerald-700",
          deltaDown: "bg-rose-50 text-rose-700",
          iconWrap: "bg-emerald-50 text-emerald-700",
        }
      : tone === "warn"
      ? {
          wrap: "bg-white border-amber-100 text-slate-900",
          label: "text-amber-600",
          value: "text-slate-900",
          deltaUp: "bg-amber-50 text-amber-700",
          deltaDown: "bg-rose-50 text-rose-700",
          iconWrap: "bg-amber-50 text-amber-700",
        }
      : {
          wrap: "bg-white border-slate-200 text-slate-900",
          label: "text-slate-500",
          value: "text-slate-900",
          deltaUp: "bg-indigo-50 text-indigo-700",
          deltaDown: "bg-rose-50 text-rose-700",
          iconWrap: "bg-indigo-50 text-indigo-700",
        };

  const deltaNode = delta ? (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
        delta.up ? theme.deltaUp : theme.deltaDown
      )}
      title="Change vs previous period"
    >
      {delta.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(delta.pct).toFixed(1)}%
    </span>
  ) : null;

  return (
    <div className={cx("relative overflow-hidden rounded-2xl border p-6 shadow-sm", theme.wrap)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cx("text-sm font-medium", theme.label)}>{title}</p>
          <div className="mt-2">
            {loading ? (
              <Skeleton className="h-9 w-48" />
            ) : (
              <h3 className={cx("text-3xl font-bold tracking-tight", theme.value)}>{value}</h3>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {loading ? (
              <>
                <Skeleton className="h-6 w-20 rounded-xl" />
                <Skeleton className="h-6 w-28 rounded-xl" />
              </>
            ) : (
              <>
                {deltaNode}
                {subtitle ? (
                  <span className={cx("text-xs", tone === "brand" ? "text-indigo-100" : "text-slate-500")}>
                    {subtitle}
                  </span>
                ) : null}
              </>
            )}
          </div>
        </div>
        <div className={cx("shrink-0 rounded-xl p-2.5", theme.iconWrap)}>{icon}</div>
      </div>
      {tone === "brand" ? (
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      ) : null}
    </div>
  );
};

const StatusBadge = ({ status, t }) => {
  const config = {
    approved: { icon: <CheckCircle size={14} />, className: "bg-emerald-100 text-emerald-700" },
    rejected: { icon: <XCircle size={14} />, className: "bg-rose-100 text-rose-700" },
    pending: { icon: <Clock size={14} />, className: "bg-amber-100 text-amber-700" },
  };
  const badge = config[status] || {};
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
      {badge.icon} {t[status] || status?.toUpperCase()}
    </span>
  );
};

const AdminDashboard = () => {
  const { lang } = useLang();
  const t = translations[lang].adminDash;
  const [partners, setPartners] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({ totalRevenue: 0, totalBusinessVolume: 0, approved: 0, pending: 0, total: 0 });
  const [revenueData, setRevenueData] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [query, setQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [appRes, statsRes] = await Promise.all([
        api.get("/admin/applications"),
        api.get("/admin/dashboard-stats"),
      ]);
      setPartners(appRes.data.applications || []);
      setDashboardStats(statsRes.data.stats);
      setRevenueData(statsRes.data.revenueData || []);
      setServiceBreakdown(statsRes.data.serviceBreakdown || []);
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

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(id);
    const reason = status === "rejected" ? prompt(t.rejectionReason) || "Not specified" : undefined;
    try {
      await api.patch(`/admin/applications/${id}`, { status, rejectionReason: reason });
      toast.success(t.successUpdate);
      fetchData();
    } catch {
      toast.error(t.errorUpdate);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners
      .filter((p) => (selectedFilter === "all" ? true : p.status === selectedFilter))
      .filter((p) => {
        if (!q) return true;
        const hay = [
          p.fullName,
          p.workType,
          p.phone,
          p.email,
          p.location?.address,
          typeof p.location === "string" ? p.location : null,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  }, [partners, query, selectedFilter]);

  const revenueDelta = useMemo(() => calcDeltaPct(revenueData, "revenue"), [revenueData]);
  const volumeDelta = useMemo(() => calcDeltaPct(revenueData, "volume"), [revenueData]);
  const approvalRate = useMemo(() => {
    const total = Number(dashboardStats?.total || 0);
    const approved = Number(dashboardStats?.approved || 0);
    if (!total) return null;
    return (approved / total) * 100;
  }, [dashboardStats]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6 sm:p-8">
      <div className="sticky top-0 z-10 -mx-6 px-6 sm:-mx-8 sm:px-8 backdrop-blur bg-white/80 border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl py-4 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{t.heading}</h1>
              <p className="mt-1 text-sm text-slate-500">{t.subheading}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchApps || "Search applications…"}
                  className="w-full rounded-xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 sm:w-[320px]"
                />
              </div>

              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                {t.refresh || "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          <KpiCard
            tone="brand"
            title={t.platformRevenue}
            value={formatCurrency(dashboardStats?.totalPlatformRevenue || 0)}
            icon={<TrendingUp size={20} />}
            delta={revenueDelta}
            subtitle={t.liveSync}
            loading={loading}
          />
          <KpiCard
            tone="neutral"
            title={t.totalBizVolume}
            value={formatCurrency(dashboardStats?.totalBusinessVolume || 0)}
            icon={<TrendingUp size={20} />}
            delta={volumeDelta}
            subtitle={t.vsLast || "vs last period"}
            loading={loading}
          />
          <KpiCard
            tone="success"
            title={t.approvedPartners}
            value={String(dashboardStats?.approved || 0)}
            icon={<Users size={20} />}
            delta={null}
            subtitle={
              approvalRate != null
                ? `${approvalRate.toFixed(0)}% ${t.approvalRate || "approval rate"}`
                : t.approvalRate || "approval rate"
            }
            loading={loading}
          />
          <KpiCard
            tone="warn"
            title={t.pendingApprovals}
            value={String(dashboardStats?.pending || 0)}
            icon={<Clock size={20} />}
            subtitle={t.needsReview || "needs review"}
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{t.revenueTrend}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {t.trendHint || "Trends update in real-time as payments are received."}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {t.liveSync || "Live sync"}
              </div>
            </div>

            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2ff" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${val}`, t.revenue || "Revenue"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title={t.noRevData || "No trend data yet"} description={t.noRevDesc || "Once payments start coming in, you'll see revenue trends here."} />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">{t.serviceBreakdown}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {t.breakdownHint || "Distribution by service category."}
            </p>

            <div className="mt-6">
              {loading ? (
                <Skeleton className="h-[320px] w-full" />
              ) : serviceBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={serviceBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={98}
                      paddingAngle={2}
                      stroke="transparent"
                    >
                      {serviceBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title={t.noCatData || "No category data"} description={t.noCatDesc || "As requests are completed, categories will appear here automatically."} />
              )}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{t.partnerApps}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {t.appsCountLabel || "Results"}:{" "}
                <span className="font-semibold text-slate-900">{filteredPartners.length}</span>
              </p>
            </div>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              {["all", "pending", "approved", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={cx(
                    "px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition",
                    selectedFilter === f
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {t[f] || f}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-5 w-44" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPartners.length === 0 ? (
            <EmptyState
              title={t.noFilters || "No applications found"}
              description={
                query
                  ? t.noSearch || "Try a different search term or clear the query."
                  : t.noApps || "Partner applications will appear here once submitted."
              }
              action={
                query ? (
                  <button
                    onClick={() => setQuery("")}
                    className="mt-2 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                  >
                    {t.clearSearch || "Clear search"}
                  </button>
                ) : null
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredPartners.map((app) => (
                <div
                  key={app._id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-900">
                        {app.fullName || "N/A"}
                      </h3>
                      <p className="mt-0.5 truncate text-sm font-semibold text-indigo-600 capitalize">
                        {app.workType || "N/A"}
                      </p>
                    </div>
                    <StatusBadge status={app.status} t={t} />
                  </div>

                  <div className="mt-4 space-y-2.5 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />{" "}
                      <span className="truncate">{app.phone || "N/A"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 text-slate-400" />{" "}
                      <span className="line-clamp-2 leading-tight">
                        {app.location?.lat
                          ? `${app.location.lat.toFixed(4)}, ${app.location.lng.toFixed(4)}`
                          : app.location?.address || app.location || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase size={14} className="text-slate-400" />{" "}
                      <span className="truncate">
                        {app.experience || 0} {t.yearsExp}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={app.idProofUrl || "#"}
                      onClick={(e) => {
                        if (!app.idProofUrl) e.preventDefault();
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cx(
                        "flex-1 rounded-xl px-3 py-2 text-center text-xs font-bold transition",
                        app.idProofUrl
                          ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {t.idProof || "ID Proof"}
                    </a>

                    <a
                      href={app.skillProofUrl || "#"}
                      onClick={(e) => {
                        if (!app.skillProofUrl) e.preventDefault();
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cx(
                        "flex-1 rounded-xl px-3 py-2 text-center text-xs font-bold transition",
                        app.skillProofUrl
                          ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {t.skillProof || "Skill Proof"}
                    </a>
                  </div>

                  {app.status === "pending" ? (
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border-t border-slate-100 pt-4">
                      <button
                        onClick={() => handleUpdateStatus(app._id, "approved")}
                        disabled={actionLoading === app._id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle size={16} /> {t.approve}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app._id, "rejected")}
                        disabled={actionLoading === app._id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
                      >
                        <XCircle size={16} /> {t.reject}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

