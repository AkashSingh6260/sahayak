import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Cta = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 dark:from-indigo-700 dark:via-indigo-800 dark:to-slate-900" />

      {/* Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-blue-400/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] bg-indigo-900/40 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 text-center text-white">
        <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">
          Are You a Service Professional?
        </h2>

        <p className="text-indigo-100/90 max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
          Join <span className="font-semibold text-white">Sahayak</span> and
          connect with thousands of customers looking for trusted professionals
          like you.
        </p>

        <button
          onClick={() => navigate("/partner")}
          className="
            group inline-flex items-center gap-3
            bg-white text-indigo-700
            px-9 py-3.5 rounded-2xl
            font-semibold
            shadow-xl
            hover:scale-105 hover:shadow-2xl
            transition-all duration-300
          "
        >
          Partner with Sahayak
          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>
    </section>
  );
};

export default Cta;
