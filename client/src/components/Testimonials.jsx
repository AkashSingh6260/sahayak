import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion as Motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Quote } from "lucide-react";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";

const SCROLL_IN_START = 0.16;
const SCROLL_IN_END = 0.9;
const OFFSETS = { left: -200, right: 200, top: -180, bottom: 180 };

function getOffscreen(direction) {
  switch (direction) {
    case "left":
      return { x: OFFSETS.left, y: 0 };
    case "right":
      return { x: OFFSETS.right, y: 0 };
    case "top":
      return { x: 0, y: OFFSETS.top };
    case "bottom":
    default:
      return { x: 0, y: OFFSETS.bottom };
  }
}

const Testimonials = () => {
  const { lang } = useLang();
  const t = translations[lang].testimonials;

  const baseItems = useMemo(() => t.items || [], [t.items]);
  const fillerItems = useMemo(
    () => [
      {
        name: "Neha Kapoor",
        role: "Working Professional",
        message: "Booking was seamless and the partner arrived exactly on time. Super convenient.",
      },
      {
        name: "Arjun Singh",
        role: "Home Owner",
        message: "Transparent pricing and verified professionals. Felt safe and reliable.",
      },
      {
        name: "Sneha Iyer",
        role: "Student",
        message: "Support team was quick and polite. Great experience overall.",
      },
      {
        name: "Vikram Jain",
        role: "Office Admin",
        message: "Saved us during a last-minute repair. The whole flow felt premium.",
      },
      {
        name: "Ishita Bose",
        role: "Apartment Resident",
        message: "Loved the updates and notifications. Everything was smooth.",
      },
      {
        name: "Karan Malhotra",
        role: "Startup Founder",
        message: "Fast, professional, and trustworthy. Exactly what I needed.",
      },
      {
        name: "Meera Nair",
        role: "Home Owner",
        message: "Great quality work and transparent charges. Would use again.",
      },
      {
        name: "Rohit Kulkarni",
        role: "Tenant",
        message: "Quick turnaround and polite professional. Solid experience.",
      },
    ],
    []
  );

  const [layout, setLayout] = useState("lg");

  useEffect(() => {
    const mdQuery = window.matchMedia("(min-width: 768px)");
    const lgQuery = window.matchMedia("(min-width: 1024px)");
    const updateLayout = () => {
      if (lgQuery.matches) setLayout("lg");
      else if (mdQuery.matches) setLayout("md");
      else setLayout("sm");
    };
    updateLayout();
    mdQuery.addEventListener("change", updateLayout);
    lgQuery.addEventListener("change", updateLayout);
    return () => {
      mdQuery.removeEventListener("change", updateLayout);
      lgQuery.removeEventListener("change", updateLayout);
    };
  }, []);

  const maxCards = layout === "lg" ? 8 : layout === "md" ? 6 : 4;

  const testimonials = useMemo(
    () =>
      Array.from({ length: maxCards }).map((_, idx) => ({
        ...[...baseItems, ...fillerItems][idx % (baseItems.length + fillerItems.length)],
        _key: `${idx}-${maxCards}`,
      })),
    [baseItems, fillerItems, maxCards]
  );

  const slots = useMemo(() => {
    if (layout === "lg") {
      return [
        { row: 1, col: 1, dir: "top" },
        { row: 1, col: 2, dir: "top" },
        { row: 1, col: 3, dir: "top" },
        { row: 2, col: 1, dir: "left" },
        { row: 2, col: 3, dir: "right" },
        { row: 3, col: 1, dir: "bottom" },
        { row: 3, col: 2, dir: "bottom" },
        { row: 3, col: 3, dir: "bottom" },
      ].slice(0, maxCards);
    }
    if (layout === "md") {
      return [
        { row: 2, col: 1, dir: "left" },
        { row: 2, col: 2, dir: "right" },
        { row: 3, col: 1, dir: "bottom" },
        { row: 3, col: 2, dir: "bottom" },
        { row: 4, col: 1, dir: "left" },
        { row: 4, col: 2, dir: "right" },
      ].slice(0, maxCards);
    }
    return [
      { row: "auto", col: "auto", dir: "top" },
      { row: "auto", col: "auto", dir: "bottom" },
      { row: "auto", col: "auto", dir: "left" },
      { row: "auto", col: "auto", dir: "right" },
    ].slice(0, maxCards);
  }, [layout, maxCards]);

  const sectionRef = useRef(null);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const heroInView = useInView(heroRef, { once: true, amount: 0.35 });

  const count = useMotionValue(0);
  const [countText, setCountText] = useState("0");

  useMotionValueEvent(count, "change", (latest) => {
    setCountText(Math.round(latest).toLocaleString("en-IN"));
  });

  useEffect(() => {
    if (!heroInView) return;
    const controls = animate(count, 130_834_586, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [count, heroInView]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-slate-950 py-16 sm:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -right-48 -bottom-48 h-[640px] w-[640px] rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(88,166,140,0.12),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(99,102,241,0.12),transparent_45%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 overflow-visible">
          {layout === "lg" ? (
            <div
              className="mx-auto grid min-h-[min(80vh,680px)] w-full max-w-5xl grid-cols-3 grid-rows-3 gap-4"
              style={{ gridTemplateRows: "minmax(0,1fr) minmax(180px,auto) minmax(0,1fr)" }}
            >
              <div
                ref={heroRef}
                className="relative z-30 col-start-2 row-start-2 flex min-h-[200px] flex-col items-center justify-center px-2 text-center sm:min-h-[220px]"
              >
                <HeroContent t={t} countText={countText} />
              </div>
              {testimonials.map((item, idx) => (
                <FlyingTestimonialCard
                  key={item._key}
                  item={item}
                  slot={slots[idx]}
                  index={idx}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>
          ) : layout === "md" ? (
            <div className="mx-auto grid min-h-[min(90vh,760px)] w-full max-w-2xl grid-cols-2 gap-3 sm:gap-4">
              <div ref={heroRef} className="relative z-30 col-span-2 row-start-1 flex flex-col items-center justify-center px-2 py-6 text-center">
                <HeroContent t={t} countText={countText} />
              </div>
              {testimonials.map((item, idx) => (
                <FlyingTestimonialCard
                  key={item._key}
                  item={item}
                  slot={slots[idx]}
                  index={idx}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-md flex-col gap-4">
              <div ref={heroRef} className="relative z-30 px-1 text-center">
                <HeroContent t={t} countText={countText} />
              </div>
              <div className="grid grid-cols-1 gap-4">
                {testimonials.map((item, idx) => (
                  <FlyingTestimonialCard
                    key={item._key}
                    item={item}
                    slot={slots[idx]}
                    index={idx}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

function HeroContent({ t, countText }) {
  return (
    <>
      <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-emerald-300" />
        {t.trustedBadge || "Trusted experiences"}
      </p>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
        {t.trustedByPrefix || "Trusted by"} <span className="bg-gradient-to-r from-emerald-200 via-slate-100 to-indigo-200 bg-clip-text text-transparent">{countText}</span>+ {t.trustedBySuffix || "Users"}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">{t.subheading}</p>
    </>
  );
}

function FlyingTestimonialCard({ item, slot, scrollYProgress, index }) {
  const direction = slot?.dir || "bottom";
  const { x: fromX, y: fromY } = getOffscreen(direction);

  const stagger = (index % 8) * 0.012;
  const start = SCROLL_IN_START + stagger;
  const end = Math.min(SCROLL_IN_END + stagger * 0.05, 1);

  const rawX = useTransform(scrollYProgress, [start, end], [fromX, 0], { clamp: true });
  const rawY = useTransform(scrollYProgress, [start, end], [fromY, 0], { clamp: true });
  const rawOpacity = useTransform(scrollYProgress, [start, start + 0.05, end], [0, 1, 1], { clamp: true });

  const stiffness = 60 + (index % 5) * 10;
  const damping = 36 + (index % 3) * 4;
  const mass = 1 + (index % 6) * 0.02;

  const springConfig = { stiffness, damping, mass, bounce: 0 };
  const x = useSpring(rawX, springConfig);
  const y = useSpring(rawY, springConfig);
  const opacity = useSpring(rawOpacity, { ...springConfig, stiffness: stiffness + 20, damping: damping + 8 });

  const gridStyle =
    slot?.row === "auto" || slot?.col === "auto"
      ? {}
      : { gridRow: slot.row, gridColumn: slot.col };

  return (
    <Motion.div
      className="relative z-10 flex min-h-0 items-stretch justify-center"
      style={{
        ...gridStyle,
        x,
        y,
        opacity,
        willChange: "transform, opacity",
      }}
    >
      <TestimonialCard item={item} />
    </Motion.div>
  );
}

const TestimonialCard = ({ item }) => (
  <div className="flex h-full min-h-[170px] w-full max-w-[280px] flex-col rounded-[1.5rem] border border-slate-800 bg-slate-900/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.35)] backdrop-blur-md sm:min-h-[180px] sm:p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-extrabold text-white sm:h-11 sm:w-11">
          {item.name?.charAt(0) || "U"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{item.name}</p>
          <p className="truncate text-xs text-white/65">{item.role}</p>
        </div>
      </div>
      <div className="shrink-0 rounded-full bg-slate-800/90 p-2 text-slate-200">
        <Quote size={16} />
      </div>
    </div>
    <p className="mt-3 flex-1 text-sm leading-relaxed text-white/85 line-clamp-4 sm:line-clamp-5">“{item.message}”</p>
  </div>
);

export default Testimonials;
