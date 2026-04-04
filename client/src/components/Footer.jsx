import { Link } from "react-router-dom";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";
import { Mail, Phone, MapPin } from "lucide-react";

// Must match App.jsx routes exactly
const SERVICE_LINKS = [
  { label: "Electrician",   to: "/request/electrician"   },
  { label: "Plumber",       to: "/request/plumber"       },
  { label: "Carpenter",     to: "/request/carpenter"     },
  { label: "AC Technician", to: "/request/ac_technician" },
  { label: "Painter",       to: "/request/painter"       },
];

const COMPANY_LINKS = [
  { label: "Home",         to: "/"        },
  { label: "How It Works", to: "/#how"    },
  { label: "Partner Info", to: "/partner" },
  { label: "Login",        to: "/login"   },
];

const Footer = () => {
  const { lang } = useLang();
  const t = translations[lang].footer;

  return (
    <footer className="bg-slate-900 text-slate-400">

      {/* ── Main footer ── */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand col */}
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2.5 mb-4 group">
            <div className="h-8 w-8 rounded-lg bg-orange-500 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
              <span className="text-white font-extrabold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-lg">{translations[lang].brand}</span>
          </Link>
          <p className="text-sm leading-relaxed text-slate-500">{t.tagline}</p>

          <div className="mt-6 space-y-2.5 text-sm">
            <a
              href="mailto:support@sahayak.com"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Mail size={14} className="text-orange-500 shrink-0" />
              support@sahayak.com
            </a>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-orange-500 shrink-0" />
              1800-XXX-XXXX
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-orange-500 shrink-0 mt-0.5" />
              <span>Bengaluru, Karnataka, India</span>
            </div>
          </div>
        </div>

        {/* Company links */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm">
            {COMPANY_LINKS.map(({ label, to }) => (
              <li key={label}>
                <Link to={to} className="hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services links */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Services</h4>
          <ul className="space-y-2.5 text-sm">
            {SERVICE_LINKS.map(({ label, to }) => (
              <li key={label}>
                <Link to={to} className="hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links from translations + support */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4">{t.quickLinks}</h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                {t.links.services}
              </Link>
            </li>
            <li>
              <Link to="/my-requests" className="hover:text-white transition-colors">
                {t.links.myRequests}
              </Link>
            </li>
            <li>
              <Link to="/partner" className="hover:text-white transition-colors">
                {t.links.partnerWithUs}
              </Link>
            </li>
          </ul>

          <h4 className="text-white font-semibold text-sm mt-8 mb-3">{t.support}</h4>
          <p className="text-sm text-slate-500">Mon–Sat, 9am to 7pm IST</p>
          <a
            href="mailto:support@sahayak.com"
            className="text-sm text-orange-500 hover:text-orange-400 transition-colors mt-1 inline-block"
          >
            support@sahayak.com
          </a>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-slate-800 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} {translations[lang].brand}. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <span className="cursor-default hover:text-slate-400 transition-colors">Privacy Policy</span>
            <span className="cursor-default hover:text-slate-400 transition-colors">Terms of Service</span>
            <span className="cursor-default hover:text-slate-400 transition-colors">Cookie Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
