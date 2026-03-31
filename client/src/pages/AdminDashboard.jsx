import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, XCircle, Clock, MapPin, Phone, Briefcase, TrendingUp, Wallet
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import api from "../config/api";
import toast from "react-hot-toast";
import useWebSocket from "../hooks/useWebSocket";

const COLORS = ["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6"];

const StatusBadge = ({ status }) => {
  const config = {
    approved: { icon: <CheckCircle size={14} />, className: "bg-emerald-100 text-emerald-700" },
    rejected: { icon: <XCircle size={14} />, className: "bg-rose-100 text-rose-700" },
    pending: { icon: <Clock size={14} />, className: "bg-amber-100 text-amber-700" },
  };
  const badge = config[status] || {};
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
      {badge.icon} {status?.toUpperCase() || "N/A"}
    </span>
  );
};

const AdminDashboard = () => {
  const [partners, setPartners] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [serviceBreakdown, setServiceBreakdown] = useState([]);
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
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // WebSocket for live refresh on any action
  const handleWsMessage = useCallback((payload) => {
    if (["payment_received", "service_completed", "application_approved", "application_rejected"].includes(payload.type)) {
      fetchData();
    }
  }, [fetchData]);

  useWebSocket(handleWsMessage);

  const updatePartnerStatus = async (id, status) => {
    const reason = status === "rejected" ? prompt("Reason for rejection") || "Not specified" : undefined;
    try {
      await api.patch(`/admin/applications/${id}`, { status, rejectionReason: reason });
      toast.success(`Partner ${status}`);
      fetchData();
    } catch {
      toast.error(`Failed to ${status} partner`);
    }
  };

  const filteredPartners = partners.filter((p) => filter === "all" ? true : p.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-slate-600">Overview of platform revenue, stats, and provider applications</p>
        </div>
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Platform Revenue */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white shadow-xl shadow-indigo-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-100 font-medium">Platform Revenue (20%)</p>
              <h2 className="text-4xl font-bold mt-2">₹{(dashboardStats?.totalPlatformRevenue || 0).toLocaleString()}</h2>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur"><Wallet size={24} /></div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-indigo-100">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live real-time sync
          </div>
        </div>

        {/* Business Volume */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 font-medium">Total Business Volume</p>
              <h2 className="text-4xl font-bold mt-2 text-slate-800">₹{dashboardStats?.totalBusinessVolume?.toLocaleString() || 0}</h2>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><TrendingUp size={24} /></div>
          </div>
          <p className="mt-6 text-sm text-slate-500">Gross transaction value processed</p>
        </div>

        {/* Provider Stats */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
            <span className="text-slate-600 font-medium">Approved Partners</span>
            <span className="text-xl font-bold text-emerald-600">{dashboardStats?.approved || 0}</span>
          </div>
          <div className="flex justify-between items-center bg-amber-50 p-3 rounded-xl mt-3">
            <span className="text-amber-700 font-medium">Pending Approvals</span>
            <span className="text-xl font-bold text-amber-600">{dashboardStats?.pending || 0}</span>
          </div>
        </div>

        {/* Total Users/Providers placeholder */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center">
           <Briefcase size={32} className="text-slate-300 mb-3" />
           <h3 className="text-2xl font-bold text-slate-800">{dashboardStats?.total || 0}</h3>
           <p className="text-slate-500 font-medium text-sm">Total Applications Received</p>
        </div>
      </div>

      {/* CHARTS SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Platform Revenue Trend (20% fee)</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={val => `₹${val}`} />
                <Tooltip cursor={{ fill: "#f8fafc" }} formatter={val => [`₹${val}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={4} activeDot={{ r: 6 }} dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] flex items-center justify-center text-slate-400">No revenue data</div>}
        </div>

        {/* Service Type Breakdown */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 mb-6">Service Breakdown</h3>
          {serviceBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={serviceBreakdown} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={2}>
                  {serviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(val, name) => [val, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[260px] flex items-center justify-center text-slate-400">No category data</div>}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {serviceBreakdown.slice(0, 4).map((s, i) => (
              <div key={s.name} className="flex items-center gap-1 text-xs font-semibold text-slate-600 capitalize">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /> {s.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PARTNER APPLICATIONS */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Partner Applications</h2>
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button key={s} onClick={() => setFilter(s)} className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${filter === s ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
           <p className="text-center text-slate-500 py-10">Loading applications…</p>
        ) : filteredPartners.length === 0 ? (
           <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
             <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-lg font-medium text-slate-600">No applications match this filter</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <div key={partner._id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{partner.fullName || "N/A"}</h3>
                    <p className="text-sm text-indigo-600 font-semibold mt-1 capitalize">{partner.workType || "N/A"}</p>
                  </div>
                  <StatusBadge status={partner.status} />
                </div>

                <div className="space-y-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /> {partner.phone || "N/A"}</div>
                  <div className="flex items-start gap-3"><MapPin size={16} className="text-slate-400 mt-0.5" /> <span className="line-clamp-2">{partner.location?.lat ? `${partner.location.lat.toFixed(4)}, ${partner.location.lng.toFixed(4)}` : partner.location || "N/A"}</span></div>
                  <div className="flex items-center gap-3"><Briefcase size={16} className="text-slate-400" /> {partner.experience || 0} Years Experience</div>
                </div>

                <div className="mt-5 flex gap-2">
                  {partner.idProof && (
                    <a href={`http://localhost:3000/${partner.idProof}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition">ID Proof</a>
                  )}
                  {partner.skillProof && (
                    <a href={`http://localhost:3000/${partner.skillProof}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition">Skill Proof</a>
                  )}
                </div>

                {partner.status === "pending" && (
                  <div className="mt-5 flex gap-2 pt-5 border-t border-slate-100">
                    <button onClick={() => updatePartnerStatus(partner._id, "approved")} className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition">Approve</button>
                    <button onClick={() => updatePartnerStatus(partner._id, "rejected")} className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600 transition">Reject</button>
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

