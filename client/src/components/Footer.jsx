import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const Footer = () => {
  const { lang } = useLang();
  const t = translations[lang].footer;

  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
        <div>
          <h3 className="text-white font-semibold mb-2">{translations[lang].brand}</h3>
          <p className="text-sm">{t.tagline}</p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">{t.quickLinks}</h4>
          <ul className="text-sm space-y-1">
            <li>{t.links.services}</li>
            <li>{t.links.myRequests}</li>
            <li>{t.links.partnerWithUs}</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-2">{t.support}</h4>
          <p className="text-sm">support@sahayak.com</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
