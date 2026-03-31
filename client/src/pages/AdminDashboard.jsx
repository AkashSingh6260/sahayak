import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, MapPin, Phone, Briefcase, TrendingUp, Wallet, Activity, Users, FileText, Trash2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import api from "../config/api";
import toast from "react-hot-toast";
import useWebSocket from "../hooks/useWebSocket";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const COLORS = ["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6"];

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
    } catch (err) {
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

  const deleteApplication = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api.delete(`/admin/applications/${id}`);
      toast.success(t.successDelete);
      fetchData();
    } catch {
      toast.error(t.errorDelete);
    }
  };

  const filteredPartners = partners.filter((p) => selectedFilter === "all" ? true : p.status === selectedFilter);

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">{t.heading}</h1>
        <p className="mt-1 text-slate-500">{t.subheading}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 shadow-lg text-white">
          <p className="text-indigo-100 font-medium">{t.platformRevenue}</p>
          <h3 className="mt-2 text-4xl font-bold">₹{(dashboardStats?.totalPlatformRevenue || 0).toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-sm text-indigo-100">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> {t.liveSync}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">{t.totalBizVolume}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">₹{(dashboardStats?.totalBusinessVolume || 0).toLocaleString()}</h3>
          <div className="mt-4 p-2 bg-indigo-50 text-indigo-600 rounded-lg w-fit"><TrendingUp size={20} /></div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">{t.approvedPartners}</p>
          <h3 className="mt-2 text-2xl font-bold text-emerald-600">{dashboardStats?.approved || 0}</h3>
          <div className="mt-4 p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit"><Users size={20} /></div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">{t.pendingApprovals}</p>
          <h3 className="mt-2 text-2xl font-bold text-amber-600">{dashboardStats?.pending || 0}</h3>
          <div className="mt-4 p-2 bg-amber-50 text-amber-600 rounded-lg w-fit"><Clock size={20} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">{t.revenueTrend}</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={val => `₹${val}`} />
                <Tooltip formatter={val => [`₹${val}`, t.revenue]} />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-[300px] flex items-center justify-center text-slate-400">{t.noRevData}</div>}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6">{t.serviceBreakdown}</h3>
          {serviceBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={serviceBreakdown} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {serviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[300px] flex items-center justify-center text-slate-400">{t.noCatData}</div>}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">{t.partnerApps}</h2>
          <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            {["all", "pending", "approved", "rejected"].map((f) => (
              <button key={f} onClick={() => setSelectedFilter(f)} className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition ${selectedFilter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {t[f] || f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">{t.loadingApps}</div>
        ) : filteredPartners.length === 0 ? (
          <div className="p-12 text-center text-slate-500">{t.noFilters}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {filteredPartners.map((app) => (
              <div key={app._id} className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{app.fullName || "N/A"}</h3>
                    <p className="text-sm font-semibold text-indigo-600 capitalize mt-0.5">{app.workType || "N/A"}</p>
                  </div>
                  <StatusBadge status={app.status} t={t} />
                </div>
                
                <div className="space-y-2.5 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl mb-4">
                  <div className="flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {app.phone || "N/A"}</div>
                  <div className="flex items-start gap-2"><MapPin size={14} className="text-slate-400 mt-0.5" /> <span className="line-clamp-2 leading-tight">{app.location?.lat ? `${app.location.lat.toFixed(4)}, ${app.location.lng.toFixed(4)}` : app.location?.address || app.location || "N/A"}</span></div>
                  <div className="flex items-center gap-2"><Briefcase size={14} className="text-slate-400" /> {app.experience || 0} {t.yearsExp}</div>
                </div>

                <div className="flex gap-2 mb-4">
                  {app.idProofUrl && (
                    <a href={app.idProofUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition">
                      {t.idProof}
                    </a>
                  )}
                  {app.skillProofUrl && (
                    <a href={app.skillProofUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-center rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition">
                      {t.skillProof}
                    </a>
                  )}
                </div>

                {app.status === "pending" && (
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => handleUpdateStatus(app._id, "approved")}
                      disabled={actionLoading === app._id}
                      className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={16} /> {t.approve}
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(app._id, "rejected")}
                      disabled={actionLoading === app._id}
                      className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600 transition disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      <XCircle size={16} /> {t.reject}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

