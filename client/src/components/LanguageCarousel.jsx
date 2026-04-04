import React, { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Home, ShieldCheck, Wrench, Zap, Hammer, Globe2 } from "lucide-react";

const languages = [
  { name: "Hindi",    label: "हिंदी",    icon: Wrench,      service: "Plumbing support",   iconBg: "bg-orange-50",  iconColor: "text-orange-600" },
  { name: "Bengali",  label: "বাংলা",    icon: Hammer,      service: "Carpentry care",     iconBg: "bg-stone-50",   iconColor: "text-stone-600" },
  { name: "Marathi",  label: "मराठी",   icon: Zap,         service: "Electrical help",    iconBg: "bg-blue-50",    iconColor: "text-blue-600" },
  { name: "Gujarati", label: "ગુજરાતી", icon: ShieldCheck, service: "Safety checks",      iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  { name: "Kannada",  label: "ಕನ್ನಡ",   icon: Home,        service: "Home repairs",       iconBg: "bg-slate-100",  iconColor: "text-slate-600" },
  { name: "Tamil",    label: "தமிழ்",   icon: Globe2,      service: "Trusted local help", iconBg: "bg-rose-50",    iconColor: "text-rose-600" },
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
    <section className="bg-white border-t border-slate-100 pt-16 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">Available across Bharat</p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Service in your own language
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-500">
            Book help in Hindi, Bengali, Marathi, Tamil and more — we connect you with local experts who speak your language.
          </p>
        </div>

        <div className="relative mt-10">
          <div className="hidden md:block">
            <div className="relative mx-auto flex h-[380px] max-w-6xl items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-8" style={{ perspective: 1000 }}>
              <div className="relative flex h-full w-full items-center justify-center">
                {cards.map((language, index) => {
                  const motionProps = cardMotion(index, activeIndex);
                  const Icon = language.icon;
                  const isActive = index === activeIndex;
                  return (
                    <Motion.button
                      key={language.name}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`absolute top-1/2 h-[290px] min-w-[210px] -translate-y-1/2 rounded-2xl border bg-white p-6 text-left focus:outline-none ${
                        isActive ? "border-orange-300 shadow-lg shadow-orange-100/50" : "border-slate-200 shadow-sm"
                      }`}
                      style={{ zIndex: motionProps.zIndex, transformStyle: "preserve-3d" }}
                      animate={{ x: motionProps.x, rotateY: motionProps.rotateY, scale: motionProps.scale, opacity: motionProps.opacity }}
                      transition={{ type: "spring", stiffness: 120, damping: 20, duration: 0.62 }}
                    >
                      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${language.iconBg}`}>
                        <Icon className={`h-5 w-5 ${language.iconColor}`} />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Language</p>
                      <h4 className="mt-2 text-xl font-bold text-slate-900">{language.name}</h4>
                      <p className="mt-1 text-sm text-slate-500">{language.label}</p>
                      <div className="mt-4 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
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
              <div className="flex gap-3 px-4">
                {cards.map((language, index) => {
                  const isActive = index === activeIndex;
                  const Icon = language.icon;
                  return (
                    <button
                      key={language.name}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`min-w-[220px] rounded-xl border bg-white p-5 text-left transition-all duration-200 ${
                        isActive ? "border-orange-300 shadow-md" : "border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${language.iconBg}`}>
                        <Icon className={`h-5 w-5 ${language.iconColor}`} />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Language</p>
                      <h4 className="mt-1.5 text-lg font-bold text-slate-900">{language.name}</h4>
                      <p className="mt-0.5 text-sm text-slate-500">{language.label}</p>
                      <div className="mt-3 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{language.service}</div>
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
