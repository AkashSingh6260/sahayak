import React from "react";
import { professions } from "./Professions.jsx";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-7xl px-4 py-20">
      
      {/* ================= Heading ================= */}
      <div className="mb-14 text-center">
        <span className="inline-block rounded-full bg-indigo-100 px-4 py-1 text-sm font-medium text-indigo-700">
          Explore Services
        </span>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
          Services at <span className="text-indigo-600">Sahayak</span>
        </h1>

        <p className="mt-3 text-slate-500">
          Choose a service and get connected with verified professionals
        </p>
      </div>

      {/* ================= Service Cards ================= */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {professions.map((professions) => {
          const Icon = professions.icon;

          return (
            <div
              key={professions.id}
              onClick={() =>
                navigate(`/request/${professions.id}`, {
                  state: { serviceType: professions.id },
                })
              }
              className="
                group cursor-pointer rounded-2xl
                border border-slate-200 bg-white
                p-6 text-center
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
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {professions.label}
              </h3>

              {/* Description */}
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                {professions.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Hero;
