import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { MapPin, Wrench, Loader2, CheckCircle } from "lucide-react";

const dummyProviders = [
  { id: 1, name: "Rohit Sharma", rating: 4.6, distance: "1.2 km" },
  { id: 2, name: "Amit Electric Works", rating: 4.4, distance: "2.1 km" },
  { id: 3, name: "QuickFix Services", rating: 4.8, distance: "3 km" },
];

const SearchProviders = () => {
  const { state } = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4">
      <div className="w-full max-w-lg">
        {/* Dynamic Island Card */}
        <div className="rounded-[32px] bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl p-8 text-center animate-fadeIn">
          <div className="flex justify-center mb-6">
            {loading ? (
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-black/10"></div>
                <div className="absolute inset-0 flex items-center justify-center animate-spinSlow">
                  <Loader2 size={32} />
                </div>
              </div>
            ) : (
              <CheckCircle size={64} className="text-green-500" />
            )}
          </div>

          <h2 className="text-xl font-semibold mb-2">
            {loading
              ? "Searching nearby providers..."
              : "Providers found near you"}
          </h2>

          <div className="flex justify-center gap-4 text-sm text-gray-600 mb-6">
            <span className="flex items-center gap-1">
              <Wrench size={14} />
              {state?.service}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {state?.location}
            </span>
          </div>

          {/* Results */}
          {!loading && (
            <div className="space-y-3 text-left">
              {dummyProviders.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all animate-slideUp"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      ⭐ {p.rating} • {p.distance} away
                    </p>
                  </div>
                  <button className="text-sm px-3 py-1 rounded-full bg-black text-white">
                    Request
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchProviders;
