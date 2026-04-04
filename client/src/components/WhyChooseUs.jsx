import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";
import { ShieldCheck, Zap, ThumbsUp, ArrowRight } from "lucide-react";

const serviceImages = [
  "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
];

// Must match the :serviceId values in App.jsx route /request/:serviceId
// and the profession IDs exported from Professions.jsx
const SERVICE_IDS = ["electrician", "plumber", "carpenter", "ac_technician", "painter"];

const FEATURES = [
  {
    icon: <ShieldCheck size={22} className="text-emerald-600" />,
    bg: "bg-emerald-50",
    title: "Verified Professionals",
    desc: "Every partner is background-checked, skill-tested, and insured before joining Sahayak.",
  },
  {
    icon: <Zap size={22} className="text-orange-500" />,
    bg: "bg-orange-50",
    title: "Fast & Reliable",
    desc: "Book a service and get a confirmed professional at your door within 60 minutes.",
  },
  {
    icon: <ThumbsUp size={22} className="text-blue-600" />,
    bg: "bg-blue-50",
    title: "Satisfaction Guaranteed",
    desc: "Not happy? We'll re-do the job for free or refund you — no questions asked.",
  },
];

const WhyChooseUs = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = translations[lang].whyChooseUs;

  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-4">

        {/* ── Section header ── */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">Why Sahayak</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            {t.heading}{" "}
            <span className="text-orange-500">{translations[lang].brand}</span>
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto mt-3 text-base leading-relaxed">
            {t.subheading}
          </p>
        </div>

        {/* ── Trust pillars ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-200 p-7 hover:shadow-md transition-shadow">
              <div className={`h-11 w-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Service image grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {t.services.map((service, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/request/${SERVICE_IDS[idx]}`, { state: { serviceType: SERVICE_IDS[idx] } })}
              className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="relative h-40 overflow-hidden bg-slate-100">
                <img
                  src={serviceImages[idx]}
                  alt={service.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition duration-400"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm text-slate-900">{service.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{service.desc}</p>
                <div className="flex items-center gap-1 mt-3 text-orange-500 text-xs font-semibold">
                  <span>Book now</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;