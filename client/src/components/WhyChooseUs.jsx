import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const serviceImages = [
  "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
];

const serviceRoutes = [
  "/service/electrician",
  "/service/plumber",
  "/service/carpenter",
  "/service/ac",
  "/service/painter",
];

const WhyChooseUs = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = translations[lang].whyChooseUs;

  return (
    <section className="py-24 bg-white">
      {/* Heading */}
      <div className="text-center mb-16 px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900">
          {t.heading} <span className="text-indigo-600">{translations[lang].brand}</span>
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          {t.subheading}
        </p>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 px-4">
        {t.services.map((service, idx) => (
          <div
            key={idx}
            onClick={() => navigate(serviceRoutes[idx])}
            className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300"
          >
            {/* Image Wrapper */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={serviceImages[idx]}
                alt={service.title}
                className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
              />
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="font-bold text-lg text-slate-800 mb-1">
                {service.title}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {service.desc}
              </p>

              {/* Accent Line */}
              <div className="h-1 w-8 bg-indigo-500 rounded-full group-hover:w-12 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;