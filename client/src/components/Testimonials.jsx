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
const SCROLL_IN_END   = 0.9;
const OFFSETS = { left: -200, right: 200, top: -180, bottom: 180 };

/* 11 vibrant-but-light card colour palettes that cycle */
const CARD_PALETTES = [
  { bg: "#fff7ed", border: "#fed7aa", avatar: "#f97316", quote: "#ea580c", text: "#7c2d12" },  // orange
  { bg: "#f0f9ff", border: "#bae6fd", avatar: "#0ea5e9", quote: "#0284c7", text: "#0c4a6e" },  // sky
  { bg: "#f0fdf4", border: "#bbf7d0", avatar: "#22c55e", quote: "#16a34a", text: "#14532d" },  // green
  { bg: "#fdf4ff", border: "#e9d5ff", avatar: "#a855f7", quote: "#9333ea", text: "#581c87" },  // purple
  { bg: "#fff1f2", border: "#fecdd3", avatar: "#f43f5e", quote: "#e11d48", text: "#881337" },  // rose
  { bg: "#fffbeb", border: "#fde68a", avatar: "#f59e0b", quote: "#d97706", text: "#78350f" },  // amber
  { bg: "#ecfdf5", border: "#a7f3d0", avatar: "#10b981", quote: "#059669", text: "#064e3b" },  // emerald
  { bg: "#eff6ff", border: "#bfdbfe", avatar: "#3b82f6", quote: "#2563eb", text: "#1e3a8a" },  // blue
  { bg: "#fff7f7", border: "#fca5a5", avatar: "#ef4444", quote: "#dc2626", text: "#7f1d1d" },  // red
  { bg: "#f9fafb", border: "#d1d5db", avatar: "#6b7280", quote: "#4b5563", text: "#111827" },  // gray
  { bg: "#fefce8", border: "#fef08a", avatar: "#eab308", quote: "#ca8a04", text: "#713f12" },  // yellow
];

function getOffscreen(direction) {
  switch (direction) {
    case "left":   return { x: OFFSETS.left,  y: 0 };
    case "right":  return { x: OFFSETS.right, y: 0 };
    case "top":    return { x: 0, y: OFFSETS.top };
    case "bottom":
    default:       return { x: 0, y: OFFSETS.bottom };
  }
}

/* ─── Star rating row ─── */
function Stars({ count = 5, color }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill={color} className="w-3.5 h-3.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

/* ─── Individual colourful card ─── */
const TestimonialCard = ({ item, index }) => {
  const p = CARD_PALETTES[index % CARD_PALETTES.length];

  return (
    <div
      style={{
        background: p.bg,
        borderColor: p.border,
        boxShadow: `0 8px 32px 0 ${p.avatar}22, 0 1.5px 6px 0 ${p.border}`,
      }}
      className="flex h-full min-h-[170px] w-full max-w-[280px] flex-col
                 rounded-[1.5rem] border-2 p-4 sm:min-h-[180px] sm:p-5
                 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar circle */}
          <div
            style={{ background: p.avatar }}
            className="flex h-10 w-10 shrink-0 items-center justify-center
                       rounded-full text-sm font-extrabold text-white shadow-sm sm:h-11 sm:w-11"
          >
            {item.name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <p
              style={{ color: p.text }}
              className="truncate text-sm font-bold"
            >
              {item.name}
            </p>
            <p
              style={{ color: p.quote }}
              className="truncate text-[11px] font-medium"
            >
              {item.role}
            </p>
          </div>
        </div>

        {/* Quote icon */}
        <div
          style={{ background: p.border, color: p.avatar }}
          className="shrink-0 rounded-full p-2"
        >
          <Quote size={14} />
        </div>
      </div>

      {/* Stars */}
      <Stars color={p.avatar} />

      {/* Message */}
      <p
        style={{ color: p.text + "cc" }}
        className="mt-2.5 flex-1 text-[13px] leading-relaxed line-clamp-4 sm:line-clamp-5"
      >
        "{item.message}"
      </p>
    </div>
  );
};

/* ─── Flying wrapper ─── */
function FlyingTestimonialCard({ item, slot, scrollYProgress, index }) {
  const direction = slot?.dir || "bottom";
  const { x: fromX, y: fromY } = getOffscreen(direction);

  const stagger = (index % 8) * 0.012;
  const start   = SCROLL_IN_START + stagger;
  const end     = Math.min(SCROLL_IN_END + stagger * 0.05, 1);

  const rawX       = useTransform(scrollYProgress, [start, end], [fromX, 0], { clamp: true });
  const rawY       = useTransform(scrollYProgress, [start, end], [fromY, 0], { clamp: true });
  const rawOpacity = useTransform(scrollYProgress, [start, start + 0.05, end], [0, 1, 1], { clamp: true });

  const stiffness    = 60  + (index % 5) * 10;
  const damping      = 36  + (index % 3) * 4;
  const mass         = 1   + (index % 6) * 0.02;
  const springConfig = { stiffness, damping, mass, bounce: 0 };

  const x       = useSpring(rawX, springConfig);
  const y       = useSpring(rawY, springConfig);
  const opacity = useSpring(rawOpacity, { ...springConfig, stiffness: stiffness + 20, damping: damping + 8 });

  const gridStyle =
    slot?.row === "auto" || slot?.col === "auto"
      ? {}
      : { gridRow: slot.row, gridColumn: slot.col };

  return (
    <Motion.div
      className="relative z-10 flex min-h-0 items-stretch justify-center"
      style={{ ...gridStyle, x, y, opacity, willChange: "transform, opacity" }}
    >
      <TestimonialCard item={item} index={index} />
    </Motion.div>
  );
}

/* ─── Centre hero text ─── */
function HeroContent({ t, countText }) {
  return (
    <>
      {/* Eyebrow badge */}
      <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200
                       bg-violet-50 px-5 py-1.5 text-[11px] font-bold uppercase
                       tracking-widest text-violet-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
        {t.trustedBadge || "Trusted experiences"}
      </span>

      <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl lg:text-5xl">
        {t.trustedByPrefix || "Trusted by"}{" "}
        <span className="bg-gradient-to-r from-violet-500 via-pink-400 to-orange-400
                         bg-clip-text text-transparent">
          {countText}
        </span>
        +{" "}
        <span className="text-slate-800">{t.trustedBySuffix || "Users"}</span>
      </h2>

      <p className="mx-auto mt-3 max-w-xs text-[13px] leading-relaxed text-slate-500 sm:text-sm">
        {t.subheading}
      </p>
    </>
  );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
const Testimonials = () => {
  const { lang } = useLang();
  const t        = translations[lang].testimonials;

  const baseItems  = useMemo(() => t.items || [], [t.items]);
  const fillerItems = useMemo(() => [
    { name: "Neha Kapoor",    role: "Working Professional", message: "Booking was seamless and the partner arrived exactly on time. Super convenient." },
    { name: "Arjun Singh",   role: "Home Owner",            message: "Transparent pricing and verified professionals. Felt safe and reliable." },
    { name: "Sneha Iyer",    role: "Student",               message: "Support team was quick and polite. Great experience overall." },
    { name: "Vikram Jain",   role: "Office Admin",          message: "Saved us during a last-minute repair. The whole flow felt premium." },
    { name: "Ishita Bose",   role: "Apartment Resident",    message: "Loved the updates and notifications. Everything was smooth." },
    { name: "Karan Malhotra",role: "Startup Founder",       message: "Fast, professional, and trustworthy. Exactly what I needed." },
    { name: "Meera Nair",    role: "Home Owner",            message: "Great quality work and transparent charges. Would use again." },
    { name: "Rohit Kulkarni",role: "Tenant",                message: "Quick turnaround and polite professional. Solid experience." },
  ], []);

  const [layout, setLayout] = useState("lg");
  useEffect(() => {
    const mdQ = window.matchMedia("(min-width: 768px)");
    const lgQ = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      if (lgQ.matches)      setLayout("lg");
      else if (mdQ.matches) setLayout("md");
      else                  setLayout("sm");
    };
    update();
    mdQ.addEventListener("change", update);
    lgQ.addEventListener("change", update);
    return () => { mdQ.removeEventListener("change", update); lgQ.removeEventListener("change", update); };
  }, []);

  const maxCards = layout === "lg" ? 8 : layout === "md" ? 6 : 4;

  const testimonials = useMemo(
    () => Array.from({ length: maxCards }).map((_, idx) => ({
      ...[...baseItems, ...fillerItems][idx % (baseItems.length + fillerItems.length)],
      _key: `${idx}-${maxCards}`,
    })),
    [baseItems, fillerItems, maxCards]
  );

  const slots = useMemo(() => {
    if (layout === "lg") return [
      { row: 1, col: 1, dir: "top" }, { row: 1, col: 2, dir: "top" }, { row: 1, col: 3, dir: "top" },
      { row: 2, col: 1, dir: "left" }, { row: 2, col: 3, dir: "right" },
      { row: 3, col: 1, dir: "bottom" }, { row: 3, col: 2, dir: "bottom" }, { row: 3, col: 3, dir: "bottom" },
    ].slice(0, maxCards);
    if (layout === "md") return [
      { row: 2, col: 1, dir: "left" }, { row: 2, col: 2, dir: "right" },
      { row: 3, col: 1, dir: "bottom" }, { row: 3, col: 2, dir: "bottom" },
      { row: 4, col: 1, dir: "left" }, { row: 4, col: 2, dir: "right" },
    ].slice(0, maxCards);
    return [
      { row: "auto", col: "auto", dir: "top" }, { row: "auto", col: "auto", dir: "bottom" },
      { row: "auto", col: "auto", dir: "left" }, { row: "auto", col: "auto", dir: "right" },
    ].slice(0, maxCards);
  }, [layout, maxCards]);

  const sectionRef = useRef(null);
  const heroRef    = useRef(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const heroInView = useInView(heroRef, { once: true, amount: 0.35 });

  const count = useMotionValue(0);
  const [countText, setCountText] = useState("0");
  useMotionValueEvent(count, "change", (latest) => setCountText(Math.round(latest).toLocaleString("en-IN")));
  useEffect(() => {
    if (!heroInView) return;
    const controls = animate(count, 130_834_586, { duration: 1.5, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [count, heroInView]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#fafaf8] py-16 sm:py-20"
    >
      {/* Subtle dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.3,
        }}
      />

      {/* Colourful soft blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-violet-100 blur-3xl opacity-70" />
        <div className="absolute top-1/2 -right-48 h-[420px] w-[420px] rounded-full bg-pink-100  blur-3xl opacity-60" />
        <div className="absolute -bottom-40 left-1/3  h-[400px] w-[400px] rounded-full bg-amber-100 blur-3xl opacity-55" />
        <div className="absolute top-1/4 left-1/4    h-[300px] w-[300px] rounded-full bg-sky-100   blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 overflow-visible">

        {/* ── Large layout ── */}
        {layout === "lg" ? (
          <div
            className="mx-auto grid min-h-[min(80vh,680px)] w-full max-w-5xl grid-cols-3 grid-rows-3 gap-4"
            style={{ gridTemplateRows: "minmax(0,1fr) minmax(200px,auto) minmax(0,1fr)" }}
          >
            <div
              ref={heroRef}
              className="relative z-30 col-start-2 row-start-2 flex min-h-[200px] flex-col
                         items-center justify-center px-2 text-center sm:min-h-[220px]"
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
            <div ref={heroRef} className="relative z-30 col-span-2 row-start-1 flex flex-col
                                          items-center justify-center px-2 py-6 text-center">
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
    </section>
  );
};

export default Testimonials;
