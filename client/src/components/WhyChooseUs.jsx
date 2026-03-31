import { useNavigate } from "react-router-dom";

const services = [
  {
    title: "Electrician",
    desc: "Wiring, repairs, installations",
    image: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?auto=format&fit=crop&w=800&q=80",
    route: "/service/electrician",
  },
  {
    title: "Plumber",
    desc: "Pipes, fittings, leak repairs",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    route: "/service/plumber",
  },
  {
    title: "Carpenter",
    desc: "Furniture, woodwork, repairs",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80",
    route: "/service/carpenter",
  },
  {
    title: "AC Technician",
    desc: "AC installation & servicing",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
    route: "/service/ac",
  },
  {
    title: "Painter",
    desc: "Interior & exterior painting",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
    route: "/service/painter",
  },
];

const WhyChooseUs = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-white">
      {/* Heading */}
      <div className="text-center mb-16 px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900">
          Services at <span className="text-indigo-600">Sahayak</span>
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          Choose a service and get connected with verified professionals near you
        </p>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 px-4">
        {services.map((service, idx) => (
          <div
            key={idx}
            onClick={() => navigate(service.route)}
            className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300"
          >
            {/* Image Wrapper */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={service.image}
                alt={service.title}
                className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
              />
            </div>

            {/* Content - Changed from Absolute to Relative for better layout control */}
            <div className="p-5">
              <h3 className="font-bold text-lg text-slate-800 mb-1">
                {service.title}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {service.desc}
              </p>

              {/* Accent Line */}
              <div className="h-1 w-8 bg-indigo-500 rounded-full group-hover:w-12 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChooseUs;