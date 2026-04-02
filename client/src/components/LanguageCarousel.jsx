import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Home, ShieldCheck, Wrench, Zap, Hammer, Globe2 } from "lucide-react";

const languages = [
  { name: "Hindi", label: "हिंदी", icon: Wrench, service: "Plumbing support", accent: "text-amber-700", ring: "ring-amber-200/70" },
  { name: "Bengali", label: "বাংলা", icon: Hammer, service: "Carpentry care", accent: "text-fuchsia-700", ring: "ring-fuchsia-200/70" },
  { name: "Marathi", label: "मराठी", icon: Zap, service: "Electrical help", accent: "text-cyan-700", ring: "ring-cyan-200/70" },
  { name: "Gujarati", label: "ગુજરાતી", icon: ShieldCheck, service: "Safety checks", accent: "text-emerald-700", ring: "ring-emerald-200/70" },
  { name: "Kannada", label: "ಕನ್ನಡ", icon: Home, service: "Home repairs", accent: "text-sky-700", ring: "ring-sky-200/70" },
  { name: "Tamil", label: "தமிழ்", icon: Globe2, service: "Trusted local help", accent: "text-violet-700", ring: "ring-violet-200/70" },
];

const desktopConfig = [
  { x: -320, rotateY: 28, scale: 0.72, opacity: 0.52, z: 2 },
  { x: -180, rotateY: 16, scale: 0.88, opacity: 0.82, z: 3 },
  { x: 0, rotateY: 0, scale: 1, opacity: 1, z: 6 },
  { x: 180, rotateY: -16, scale: 0.88, opacity: 0.82, z: 3 },
  { x: 320, rotateY: -28, scale: 0.72, opacity: 0.52, z: 2 },
];

function cardMotion(index, activeIndex) {
  const offset = index - activeIndex;
  if (offset < -2) return { x: -420, rotateY: 35, scale: 0.68, opacity: 0, zIndex: 1 };
  if (offset > 2) return { x: 420, rotateY: -35, scale: 0.68, opacity: 0, zIndex: 1 };
  const config = desktopConfig[offset + 2];
  return { x: config.x, rotateY: config.rotateY, scale: config.scale, opacity: config.opacity, zIndex: config.z };
}

const LanguageCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(2);
  const [isDesktop, setIsDesktop] = useState(false);
  const cards = useMemo(() => languages, []);

  useEffect(() => {
    const updateMode = () => setIsDesktop(window.innerWidth >= 1024 && window.innerWidth > window.innerHeight);
    updateMode();
    window.addEventListener("resize", updateMode);
    return () => window.removeEventListener("resize", updateMode);
  }, []);

  useEffect(() => {
    if (!isDesktop) return undefined;
    const interval = setInterval(() => setActiveIndex((prev) => (prev + 1) % cards.length), 1400);
    return () => clearInterval(interval);
  }, [cards.length, isDesktop]);

  return (
    <section className="bg-slate-50 pt-16 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-600">Localized support for every language</p>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Speak with local experts in your own bhasha
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Our 3D language carousel shows how Sahayak connects users across Bharat with trusted help in Hindi, Bengali, Marathi, Tamil and more.
          </p>
        </div>

        <div className="relative mt-12">
          <div className="hidden md:block">
            <div className="relative mx-auto flex h-[420px] max-w-6xl items-center justify-center rounded-[2rem] bg-white p-8 shadow-sm" style={{ perspective: 1000 }}>
              <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-slate-50 via-white to-slate-50" />
              <div className="relative flex h-full w-full items-center justify-center">
                {cards.map((language, index) => {
                  const motionProps = cardMotion(index, activeIndex);
                  const Icon = language.icon;
                  return (
                    <Motion.button
                      key={language.name}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className="absolute top-1/2 h-[320px] min-w-[230px] -translate-y-1/2 rounded-[2rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md focus:outline-none"
                      style={{ zIndex: motionProps.zIndex, transformStyle: "preserve-3d" }}
                      animate={{
                        x: motionProps.x,
                        rotateY: motionProps.rotateY,
                        scale: motionProps.scale,
                        opacity: motionProps.opacity,
                      }}
                      transition={{ type: "spring", stiffness: 120, damping: 20, duration: 0.62 }}
                    >
                      <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-2 ${language.ring}`}>
                        <Icon className={`h-6 w-6 ${language.accent}`} />
                      </div>
                      <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Language</p>
                      <h4 className="mt-3 text-2xl font-semibold text-slate-900">{language.name}</h4>
                      <p className="mt-2 text-base text-slate-500">{language.label}</p>
                      <div className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-700">
                        {language.service}
                      </div>
                    </Motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="md:hidden">
            <div className="-mx-4 overflow-x-auto pb-6 pt-6">
              <div className="flex gap-4 px-4">
                {cards.map((language, index) => {
                  const isActive = index === activeIndex;
                  const Icon = language.icon;
                  return (
                    <button
                      key={language.name}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`min-w-[260px] rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-300 ${
                        isActive ? "scale-[1.03] shadow-md" : "scale-100"
                      }`}
                    >
                      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-2 ${language.ring}`}>
                        <Icon className={`h-6 w-6 ${language.accent}`} />
                      </div>
                      <p className="text-sm uppercase tracking-[0.32em] text-slate-500">Language</p>
                      <h4 className="mt-3 text-2xl font-semibold text-slate-900">{language.name}</h4>
                      <p className="mt-2 text-sm text-slate-500">{language.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LanguageCarousel;
