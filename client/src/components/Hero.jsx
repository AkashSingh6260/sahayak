import React from "react";
import { professions as professionData } from "./Professions.jsx";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";
import { ShieldCheck, Star, Clock } from "lucide-react";

// Neutral, professional icon backgrounds — one tint per service
const CARD_STYLES = [
  { iconBg: "bg-orange-50", iconColor: "text-orange-600", border: "hover:border-orange-300" },
  { iconBg: "bg-blue-50",   iconColor: "text-blue-600",   border: "hover:border-blue-300"   },
  { iconBg: "bg-stone-50",  iconColor: "text-stone-600",  border: "hover:border-stone-300"  },
  { iconBg: "bg-cyan-50",   iconColor: "text-cyan-600",   border: "hover:border-cyan-300"   },
  { iconBg: "bg-rose-50",   iconColor: "text-rose-600",   border: "hover:border-rose-300"   },
];

const TRUST_STATS = [
  { icon: <Star size={15} className="text-amber-500 fill-amber-400" />, value: "4.8★", label: "Average rating" },
  { icon: <ShieldCheck size={15} className="text-emerald-600" />,       value: "500+",  label: "Verified partners" },
  { icon: <Clock size={15} className="text-blue-600" />,                value: "60 min", label: "Avg. response time" },
];

const Hero = () => {
  const navigate  = useNavigate();
  const { lang }  = useLang();
  const t         = translations[lang].hero;
  const tProf     = translations[lang].professions;

  return (
    <section className="bg-white border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-14">

        {/* ── Heading block ── */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block rounded-full bg-orange-50 border border-orange-200 px-4 py-1 text-xs font-semibold text-orange-700 uppercase tracking-widest mb-4">
            {t.badge}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
            {t.heading}
            {t.headingHighlight && (
              <> <span className="text-orange-500">{t.headingHighlight}</span></>
            )}
          </h1>
          <p className="mt-4 text-base text-slate-500 leading-relaxed max-w-xl mx-auto">
            {t.subheading}
          </p>
        </div>

        {/* ── Service cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {professionData.map((profession, idx) => {
            const Icon      = profession.icon;
            const localised = tProf[profession.id] || {};
            const style     = CARD_STYLES[idx % CARD_STYLES.length];

            return (
              <div
                key={profession.id}
                onClick={() => navigate(`/request/${profession.id}`, { state: { serviceType: profession.id } })}
                className={`
                  group cursor-pointer rounded-xl bg-white border border-slate-200
                  p-5 text-center transition-all duration-200
                  hover:-translate-y-1 hover:shadow-lg ${style.border}
                `}
              >
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${style.iconBg} transition-all duration-200 group-hover:scale-105`}>
                  <Icon className={`h-6 w-6 ${style.iconColor}`} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-800">
                  {localised.label || profession.label}
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-snug">
                  {localised.description || profession.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Trust stats ── */}
        <div className="mt-10 flex items-center justify-center gap-8 flex-wrap">
          {TRUST_STATS.map(({ icon, value, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              {icon}
              <span className="font-bold text-slate-800">{value}</span>
              <span className="text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
