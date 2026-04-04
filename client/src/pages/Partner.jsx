import React from "react";
import { professions as professionData } from "../components/Professions.jsx";
import { useNavigate } from "react-router-dom";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const Partner = () => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = translations[lang].partner;
  const tProf = translations[lang].professions;

  return (
    <div className="min-h-screen bg-slate-50 py-14">
      <div className="mx-auto max-w-6xl px-4">

      
        <div className="mb-16 text-center">
          <span className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-sm font-medium text-indigo-700">
            {t.badge}
          </span>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
            {t.heading} <span className="text-indigo-600">{translations[lang].brand}</span> {t.headingSuffix}
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-base text-slate-600">
            {t.description1}{" "}
            <strong className="text-indigo-600">{t.description2}</strong>{" "}
            {t.description3}
          </p>
        </div>

      
        <div className="mb-12 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-3 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              1
            </div>
            <p className="text-sm font-medium text-slate-800">
              {t.stepLabel}
            </p>
          </div>
        </div>

     
        <div className="mb-10 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            {t.chooseService}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t.chooseServiceSub}
          </p>
        </div>

     
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {professionData.map((profession) => {
            const Icon = profession.icon;
            const localised = tProf[profession.id] || {};

            return (
              <div
                key={profession.id}
                onClick={() => navigate(`/partner/apply/${profession.id}`)}
                className="
                  group cursor-pointer rounded-2xl border border-slate-200
                  bg-white p-6 text-center
                  transition-all duration-300
                  hover:-translate-y-1 hover:border-indigo-400
                  hover:shadow-[0_20px_40px_rgba(79,70,229,0.15)]
                "
              >
                {/* Icon */}
                <div
                  className="
                    mx-auto flex h-14 w-14 items-center justify-center rounded-xl
                    bg-indigo-50
                    transition-all duration-300
                    group-hover:bg-indigo-600 group-hover:scale-110
                  "
                >
                  <Icon className="h-7 w-7 text-indigo-600 group-hover:text-white" />
                </div>

                {/* Title */}
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {localised.label || profession.label}
                </h3>

                {/* Hint */}
                <p className="mt-1 text-xs text-slate-500">
                  {t.tapToContinue}
                </p>
              </div>
            );
          })}
        </div>

       
        <div className="mt-16 text-center text-sm text-slate-500">
          {t.footerHint}
        </div>
      </div>
    </div>
  );
};

export default Partner;
