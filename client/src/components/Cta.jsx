import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const Cta = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = translations[lang].cta;

  return (
    <section className="bg-slate-900 py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">

        {/* Eyebrow */}
        <p className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">
          Partner with us
        </p>

        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
          {t.heading}
        </h2>

        <p className="text-slate-400 max-w-xl mx-auto mb-10 text-base leading-relaxed">
          {t.subheading}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/partner"
            className="group inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-orange-500/20"
          >
            {t.button}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-colors"
          >
            Learn more
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-3 gap-6 border-t border-slate-800 pt-10 max-w-lg mx-auto">
          {[
            { value: "50K+",  label: "Bookings completed" },
            { value: "500+",  label: "Verified partners"  },
            { value: "4.8★",  label: "Customer rating"    },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Cta;
