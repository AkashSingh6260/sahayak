const steps = [
  {
    title: "Choose a Service",
    desc: "Select the service you need from our platform",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Describe Your Problem",
    desc: "Explain the issue and share your location",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Get Connected",
    desc: "Verified professionals will contact you shortly",
    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-28 bg-gradient-to-br from-indigo-50 via-white to-blue-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Heading */}
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-20 text-slate-800 dark:text-white">
        How <span className="text-indigo-600">Sahayak</span> Works
      </h2>

      <div className="max-w-6xl mx-auto space-y-24 px-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`flex flex-col md:flex-row items-center gap-14 ${
              idx % 2 !== 0 ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Image */}
            <div className="md:w-1/2 flex justify-center">
              <div className="relative group">
                <img
                  src={step.image}
                  alt={step.title}
                  className="
                    w-full
                    max-w-sm
                    md:max-w-md
                    rounded-3xl
                    shadow-xl
                    transition-transform
                    duration-500
                    group-hover:scale-105
                  "
                />

                {/* Glow */}
                <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition"></div>
              </div>
            </div>

            {/* Text */}
            <div className="md:w-1/2">
              {/* Step Badge */}
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-sm font-semibold px-5 py-1.5 rounded-full mb-5 shadow-lg">
                Step {idx + 1}
              </span>

              <h3 className="text-2xl md:text-3xl font-semibold mb-4 text-slate-800 dark:text-white">
                {step.title}
              </h3>

              <p className="text-slate-600 dark:text-slate-300 max-w-md leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
