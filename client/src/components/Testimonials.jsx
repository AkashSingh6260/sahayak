import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ankit Verma",
    role: "Home Owner",
    rating: 5,
    message:
      "Found an electrician within minutes. The professional was verified and very skilled. Highly recommended!",
  },
  {
    name: "Pooja Sharma",
    role: "Apartment Resident",
    rating: 4,
    message:
      "Smooth experience from start to finish. The plumber arrived on time and fixed the issue quickly.",
  },
  {
    name: "Rahul Mehta",
    role: "Office Manager",
    rating: 5,
    message:
      "Sahayak saved us during an AC breakdown. Great platform and reliable service partners.",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-semibold text-center mb-3">
          Loved by Our Customers
        </h2>
        <p className="text-center text-gray-500 mb-12">
          Real experiences from people who used Sahayak
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="relative bg-white rounded-2xl p-6 shadow-sm border hover:shadow-lg transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 -right-4 bg-indigo-600 text-white p-3 rounded-full shadow-md">
                <Quote size={18} />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={`${
                      i < t.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Message */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                “{t.message}”
              </p>

              {/* User */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-indigo-600 font-semibold flex items-center justify-center">
                  {t.name.charAt(0)}
                </div>

                <div>
                  <p className="font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
