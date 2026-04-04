import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck, Zap, Star, Eye, EyeOff, ArrowRight, User, Mail, Lock } from "lucide-react";

import api from "../config/api";
import { loginSuccess } from "../app/features/authSlice";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

// Trust bullets shown on the left panel
const TRUST_POINTS = [
  { icon: <ShieldCheck size={17} className="text-emerald-400" />, text: "Every professional is verified & background-checked" },
  { icon: <Zap size={17} className="text-orange-400" />,          text: "Book a service and get help within 60 minutes"      },
  { icon: <Star size={17} className="text-amber-400 fill-amber-400" />, text: "4.8★ rated by 50,000+ happy customers across India" },
];

// Services listed on left panel
const SERVICES = ["Electrician", "Plumber", "Carpenter", "AC Technician", "Painter"];

const Login = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { lang }  = useLang();
  const t         = translations[lang].login;

  const [mode, setMode]       = useState(location.pathname === "/register" ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  // Sync mode if URL changes
  useEffect(() => {
    setMode(location.pathname === "/register" ? "register" : "login");
  }, [location.pathname]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const res = await api.post(endpoint, formData);
      dispatch(loginSuccess({ user: res.data.user, token: res.data.token }));
      toast.success(mode === "login" ? t.loggedInSuccess : t.accountCreated);
      const role = res.data.user?.role;
      if (role === "service_provider") navigate("/provider/dashboard");
      else if (role === "admin")       navigate("/admin/dashboard");
      else                             navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || t.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    const next = mode === "login" ? "register" : "login";
    setMode(next);
    navigate(`/${next}`);
    setFormData({ name: "", email: "", password: "" });
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-slate-900 px-12 py-14 relative overflow-hidden">

        {/* Background texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, rgba(249,115,22,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59,130,246,0.08) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top — logo */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-white font-extrabold text-base">S</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Sahayak</span>
          </div>

          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Trusted home services,<br />delivered to your door.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Book verified electricians, plumbers, carpenters and more — in minutes.
          </p>

          {/* Trust points */}
          <div className="mt-10 space-y-4">
            {TRUST_POINTS.map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <p className="text-slate-300 text-sm leading-snug">{text}</p>
              </div>
            ))}
          </div>

          {/* Service chips */}
          <div className="mt-10 flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <span key={s} className="rounded-full bg-white/8 border border-white/12 px-3 py-1 text-xs text-slate-400 font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom — social proof */}
        <div className="relative">
          <div className="flex items-center gap-3 border-t border-white/10 pt-8">
            {/* Avatar stack */}
            <div className="flex -space-x-2">
              {["bg-orange-500", "bg-blue-500", "bg-emerald-500", "bg-violet-500"].map((c, i) => (
                <div key={i} className={`h-7 w-7 rounded-full ${c} border-2 border-slate-900 flex items-center justify-center`}>
                  <span className="text-white text-[9px] font-bold">{["R", "A", "M", "P"][i]}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-white text-xs font-semibold">50,000+ customers</p>
              <p className="text-slate-500 text-[11px]">trust Sahayak across India</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-white">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">S</span>
            </div>
            <span className="text-slate-900 font-bold text-lg">Sahayak</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {mode === "login" ? t.welcomeBack : t.createAccount}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              {mode === "login"
                ? t.loginToContinue
                : t.signUpToGetStarted}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); navigate(`/${m}`); setFormData({ name: "", email: "", password: "" }); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                  mode === m
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m === "login" ? t.login || "Login" : t.register || "Register"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name — register only */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  {t.fullName || "Full Name"}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                    <User size={15} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Anita Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                {t.emailAddress || "Email Address"}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                  <Mail size={15} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {t.password || "Password"}
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                  <Lock size={15} className="text-slate-400" />
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-11 flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold text-sm transition-colors shadow-md shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {t.pleaseWait || "Please wait..."}
                </span>
              ) : (
                <>
                  {mode === "login" ? (t.login || "Sign In") : (t.createAccount || "Create Account")}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === "login" ? t.dontHaveAccount : t.alreadyHaveAccount}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="text-orange-500 font-semibold hover:text-orange-600 transition-colors"
            >
              {t.clickHere || "Click here"}
            </button>
          </p>

          {/* Legal */}
          <p className="text-center text-[11px] text-slate-400 mt-8 leading-relaxed">
            By continuing, you agree to Sahayak's{" "}
            <span className="underline cursor-pointer hover:text-slate-600">Terms of Service</span>{" "}
            and{" "}
            <span className="underline cursor-pointer hover:text-slate-600">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
