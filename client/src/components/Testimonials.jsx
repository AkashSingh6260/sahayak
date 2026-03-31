import { Star, Quote } from "lucide-react";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const Testimonials = () => {
  const { lang } = useLang();
  const t = translations[lang].testimonials;

  const ratings = [5, 4, 5];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-3">
          {t.heading}
        </h2>
        <p className="text-center text-gray-500 mb-12">
          {t.subheading}
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {t.items.map((item, idx) => (
            <div
              key={idx}
              className="relative bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 -right-4 bg-indigo-600 text-white p-3 rounded-full shadow-md">
                <Quote size={18} />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={`${
                      i < ratings[idx]
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Message */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                "{item.message}"
              </p>

              {/* User */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-indigo-600 font-semibold flex items-center justify-center">
                  {item.name.charAt(0)}
                </div>

                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
