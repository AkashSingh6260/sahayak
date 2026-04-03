import React, { useRef } from "react";
import { useLang } from "../context/LanguageContext.jsx";
import translations from "../context/translations.js";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

/* ─── Per-step visual data ─── */
const STEP_DATA = [
  {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
    accent: "#f97316",
    softBg: "#fff7ed",
    border: "#fed7aa",
    avatarEmoji: "🙋‍♀️",
    quote: "I found an electrician in under 3 minutes!",
    author: "Priya, Pune",
    tag: "2 min avg. response",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
    accent: "#0ea5e9",
    softBg: "#f0f9ff",
    border: "#bae6fd",
    avatarEmoji: "👷‍♂️",
    quote: "I describe the problem once — they show up ready.",
    author: "Rajan, Surat",
    tag: "Verified & trained",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80",
    accent: "#22c55e",
    softBg: "#f0fdf4",
    border: "#bbf7d0",
    avatarEmoji: "🤝",
    quote: "OTP, live tracking, UPI — all in one tap.",
    author: "Meera, Mumbai",
    tag: "Secure & transparent",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
];

/* ─── Floating tag pill ─── */
function FloatingPill({ tag, accent, border }) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-7, 7, -7] }}
      transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
      style={{ borderColor: border, color: accent, background: "#fff" }}
      className="absolute -top-4 right-4 z-20 flex items-center gap-2
                 rounded-full border px-4 py-2 text-[11px] font-bold
                 shadow-md shadow-black/5"
    >
      <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: accent }} />
      {tag}
    </motion.div>
  );
}

/* ─── User quote card ─── */
function QuoteCard({ quote, author, avatarEmoji, border }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      viewport={{ once: true }}
      style={{ borderColor: border }}
      className="absolute -bottom-6 -left-4 z-20 max-w-[210px]
                 rounded-2xl bg-white border p-4 shadow-xl shadow-black/6"
    >
      <p className="text-[11px] leading-snug text-slate-600 italic mb-2.5">
        "{quote}"
      </p>
      <div className="flex items-center gap-2">
        <span className="text-lg">{avatarEmoji}</span>
        <span className="text-[10px] font-semibold text-slate-400">— {author}</span>
      </div>
    </motion.div>
  );
}

/* ─── One step row ─── */
function StepRow({ step, idx, t }) {
  const d = STEP_DATA[idx] || STEP_DATA[0];
  const isEven = idx % 2 === 0;

  const rowRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: rowRef,
    offset: ["start 0.88", "start 0.3"],
  });
  const rawX = useTransform(scrollYProgress, [0, 1], [isEven ? -36 : 36, 0]);
  const x = useSpring(rawX, { stiffness: 80, damping: 22 });
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.7], [0, 1]), { stiffness: 80, damping: 22 });

  return (
    <div
      ref={rowRef}
      className={`flex flex-col items-center gap-12 md:gap-20
        ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
    >
      {/* ── Image ── */}
      <motion.div style={{ x, opacity }} className="relative md:w-1/2 flex justify-center">
        <div className="relative group w-full max-w-[420px]">
          {/* Soft glow */}
          <div
            className="absolute inset-0 rounded-[2rem] blur-2xl -z-10 scale-90
                        opacity-20 group-hover:opacity-35 group-hover:scale-100
                        transition-all duration-700"
            style={{ background: d.accent }}
          />

          {/* Image frame */}
          <motion.div
            whileHover={{ scale: 1.025, rotate: isEven ? 1 : -1 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            style={{ borderColor: d.border }}
            className="relative rounded-[2rem] overflow-hidden shadow-lg border-4"
          >
            <img
              src={d.image}
              alt={step.title}
              className="w-full h-64 md:h-80 object-cover
                         transition-transform duration-700 group-hover:scale-105"
            />
            {/* light colour overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{ background: `linear-gradient(135deg, ${d.accent}, transparent)` }}
            />
          </motion.div>

          <FloatingPill tag={d.tag} accent={d.accent} border={d.border} />
          <QuoteCard
            quote={d.quote}
            author={d.author}
            avatarEmoji={d.avatarEmoji}
            border={d.border}
          />
        </div>
      </motion.div>

      {/* ── Text ── */}
      <motion.div
        initial={{ opacity: 0, x: isEven ? 36 : -36 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.75, ease: "easeOut", delay: 0.15 }}
        className="md:w-1/2 flex flex-col"
      >
        {/* Step chip */}
        <div
          className="mb-6 inline-flex items-center gap-3 self-start
                     rounded-2xl px-4 py-2 text-sm font-bold shadow-sm"
          style={{ background: d.softBg, color: d.accent, border: `1.5px solid ${d.border}` }}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-xl text-white font-black text-sm"
            style={{ background: d.accent }}
          >
            {idx + 1}
          </span>
          {t.step} {idx + 1}
        </div>

        <h3 className="text-3xl md:text-4xl font-extrabold text-slate-800 leading-tight mb-4">
          {step.title}
        </h3>

        <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-md mb-8">
          {step.desc}
        </p>

        {/* Proof badges */}
        <div className="flex flex-wrap gap-3">
          {(t.stepBadges || []).map((badge, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              viewport={{ once: true }}
              style={{
                borderColor: d.border,
                color: d.accent,
                background: d.softBg,
              }}
              className="inline-flex items-center gap-2 rounded-full border
                         px-4 py-1.5 text-xs font-semibold shadow-sm"
            >
              <span style={{ color: d.accent }}>{d.icon}</span>
              {badge}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Dotted connector between steps ─── */
function StepConnector({ color }) {
  return (
    <div className="hidden md:flex justify-center py-2 my-2">
      <div className="flex flex-col items-center gap-1.5">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ delay: i * 0.07 }}
            viewport={{ once: true }}
            style={{ background: color }}
            className="w-0.5 h-4 rounded-full opacity-30"
          />
        ))}
        <div
          className="h-3 w-3 rounded-full border-2"
          style={{ borderColor: color, background: color + "25" }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const HowItWorks = () => {
  const { lang } = useLang();
  const t = translations[lang].howItWorks;

  return (
    <section className="relative overflow-hidden bg-[#fafaf8] py-24 md:py-32">

      {/* Very subtle dot grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />

      {/* Soft blobs for depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-orange-100 blur-3xl opacity-60" />
        <div className="absolute top-1/3 -right-48 h-[420px] w-[420px] rounded-full bg-sky-100 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-green-100 blur-3xl opacity-40" />
      </div>

      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative text-center mb-20 px-4"
      >
        {/* Eyebrow badge */}
        <span
          className="mb-5 inline-flex items-center gap-2 rounded-full border
                     border-orange-200 bg-orange-50 px-5 py-1.5
                     text-[11px] font-bold uppercase tracking-widest text-orange-500"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
          Simple · Fast · Trusted
        </span>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold
                       text-slate-800 tracking-tight leading-tight">
          {t.heading}{" "}
          <span className="relative inline-block">
            <span className="relative z-10 text-orange-500">
              {translations[lang].brand}
            </span>
            {/* Hand-drawn underline */}
            <motion.svg
              className="absolute -bottom-1.5 left-0 w-full overflow-visible"
              height="10"
              viewBox="0 0 200 10"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
            >
              <motion.path
                d="M2 8 Q50 2 100 7 Q150 12 198 4"
                stroke="#fdba74"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.5 }}
              />
            </motion.svg>
          </span>{" "}
          {t.headingSuffix}
        </h2>

        <p className="mt-5 text-sm md:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
          Real people. Real homes. Problems solved in minutes — not days.
        </p>
      </motion.div>

      {/* ── STEPS ── */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {t.steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <StepRow step={step} idx={idx} t={t} />
            {idx < t.steps.length - 1 && (
              <StepConnector color={STEP_DATA[idx + 1]?.accent || "#f97316"} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── TRUST STRIP ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, delay: 0.15 }}
        className="relative mt-24 mx-auto max-w-3xl px-4"
      >
        <div
          className="flex flex-wrap justify-center gap-8 rounded-3xl
                     border border-slate-200 bg-white px-8 py-7
                     shadow-md shadow-slate-100"
        >
          {[
            { num: "2 min",  label: "Avg. response time",    emoji: "⚡" },
            { num: "1.3 Cr+", label: "Happy customers",      emoji: "😊" },
            { num: "4.8 ★",  label: "App store rating",      emoji: "🌟" },
            { num: "100%",   label: "Background-verified",   emoji: "🛡️" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-xl mb-0.5">{stat.emoji}</span>
              <span className="text-2xl font-extrabold text-slate-800">
                {stat.num}
              </span>
              <span className="text-[11px] text-slate-400 text-center leading-tight">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default HowItWorks;
