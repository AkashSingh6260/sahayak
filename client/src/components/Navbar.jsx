import {
  HeartHandshakeIcon,
  ClipboardList,
  Star,
  LogOut,
  Bell,
  Languages,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../app/features/authSlice.js";
import api from "../config/api";
import useWebSocket from "../hooks/useWebSocket.js";
import toast from "react-hot-toast";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const Navbar = () => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellPulse, setBellPulse] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const { lang, toggleLang } = useLang();
  const t = translations[lang].nav;
  const tLang = translations[lang].langToggle;

  const handleLogout = () => {
    dispatch(logout());
    setProfileOpen(false);
    navigate("/login");
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target))
        setShowNotifications(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Initial fetch of historical notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications/my");
        setNotifications(res.data.notifications || res.data || []);
      } catch {
        setNotifications([]);
      }
    };
    if (user) fetchNotifications();
  }, [user]);

  // WebSocket — prepend new notifications to list, pulse bell
  const handleWsMessage = useCallback((payload) => {
    const notifTypes = [
      "notification", "new_request", "request_accepted", "request_cancelled",
      "otp_sent", "service_started", "billing_ready", "payment_received",
      "application_approved", "application_rejected", "rating_received",
      "request_taken",
    ];
    if (notifTypes.includes(payload.type)) {
      setNotifications((prev) => [
        {
          _id: Date.now().toString(),
          message: payload.message,
          createdAt: new Date().toISOString(),
          isRead: false,
        },
        ...prev,
      ]);

      setBellPulse(true);
      setTimeout(() => setBellPulse(false), 3000);

      if (payload.type !== "billing_ready") {
        toast(payload.message, {
          icon: payload.type === "request_accepted" ? "✅" :
                payload.type === "payment_received" ? "💰" :
                payload.type === "application_approved" ? "🎉" : "🔔",
          duration: 5000,
        });
      }
    }
  }, []);

  useWebSocket(handleWsMessage, !!user);

  const unreadCount = notifications.filter((n) => !n.isRead && !n.status?.includes("read")).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="w-full flex justify-center mt-6 sticky top-4 z-50">
      <nav
        className="
          relative flex items-center justify-between
          w-full max-w-5xl
          rounded-[999px]
          border border-black/10
          bg-white/75 backdrop-blur-xl
          px-6 py-3 text-sm
          shadow-[0_10px_30px_rgba(0,0,0,0.12)]
        "
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-semibold">
            S
          </div>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-gray-700">
          {user?.role === "service_provider" ? (
            <Link to="/pro-requests" className="flex items-center gap-2 hover:text-black transition">
              <ClipboardList size={18} />
              {t.requests}
            </Link>
          ) : (
            <Link to="/partner" className="flex items-center gap-2 hover:text-black transition">
              <HeartHandshakeIcon size={18} />
              {t.partnerWithSahayak}
            </Link>
          )}
        </div>

        {/* Right */}
        <div className="hidden md:flex items-center gap-3">

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            title={`Switch to ${tLang.switchTo}`}
            className="flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-black/5 transition"
          >
            <Languages size={14} />
            {tLang.switchTo}
          </button>

          {!user ? (
            <>
              <Link to="/register">
                <button className="rounded-full border border-black/20 px-4 py-2 text-gray-700 hover:bg-black/5 transition">
                  {t.register}
                </button>
              </Link>
              <Link to="/login">
                <button className="rounded-full bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 transition">
                  {t.login}
                </button>
              </Link>
            </>
          ) : (
            <div ref={profileRef} className="relative flex items-center gap-3">
              {/* Profile */}
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 px-3 py-1 rounded-full hover:bg-black/5 transition"
              >
                <span className="text-gray-800">{t.hi} <strong>{user.name}</strong></span>
                <img
                  src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200"
                  className="w-8 h-8 rounded-full"
                  alt="profile"
                />
              </button>

              {/* Notifications Bell */}
              <div ref={notificationRef} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) markAllRead();
                  }}
                  className="relative"
                >
                  <Bell
                    className={`w-5 h-5 cursor-pointer transition ${
                      bellPulse ? "text-indigo-600 animate-bounce" : "text-gray-700 hover:text-black"
                    }`}
                  />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                  {bellPulse && (
                    <span className="absolute -top-2 -right-2 rounded-full bg-indigo-400 opacity-40 w-5 h-5 animate-ping" />
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-4 w-96 rounded-3xl bg-white/95 backdrop-blur-2xl border border-black/10 shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden z-50">
                    <div className="px-5 py-4 border-b border-black/10 flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">{t.notifications}</h3>
                      {notifications.length > 0 && (
                        <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                          {t.markAllRead}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-gray-500">{t.noNotifications}</div>
                      ) : (
                        notifications.slice(0, 20).map((n) => (
                          <div
                            key={n._id}
                            className={`px-5 py-4 border-b border-black/5 hover:bg-black/5 transition ${
                              !n.isRead && n.status !== "read" ? "bg-indigo-50/50" : ""
                            }`}
                          >
                            <p className="text-sm font-medium text-gray-900">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-14 w-56 bg-white/95 rounded-3xl shadow-xl border border-black/10">
                  <div className="px-4 py-3 border-b border-black/10">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-indigo-600 font-medium capitalize mt-0.5">{translations[lang].roles?.[user.role] || user.role}</p>
                  </div>
                  <Link to="/my-requests" className="flex gap-3 px-4 py-2 hover:bg-black/5 transition">
                    <ClipboardList size={16} /> {t.myRequests}
                  </Link>
                  {user.role === "service_provider" && (
                    <Link to="/provider/dashboard" className="flex gap-3 px-4 py-2 hover:bg-black/5 transition">
                      <Star size={16} /> {t.dashboard}
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link to="/admin/dashboard" className="flex gap-3 px-4 py-2 hover:bg-black/5 transition">
                      <Star size={16} /> {t.adminPanel}
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex gap-3 px-4 py-2 text-red-500 w-full hover:bg-red-50 transition"
                  >
                    <LogOut size={16} /> {t.logout}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
