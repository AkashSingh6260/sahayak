import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Sparkles } from "lucide-react";

const ProviderSidebar = () => {
  return (
    <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200 shadow-xl">
      {/* Brand */}
      <div className="px-6 py-6 flex items-center gap-3 border-b">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
          S
        </div>
        <div>
          <p className="font-semibold text-slate-800">Sahayak</p>
          <span className="text-xs text-slate-500">Service Provider</span>
        </div>
      </div>

      {/* Menu */}
      <nav className="px-4 py-6 space-y-2">
        <NavLink
          to="/provider"
          end
          className={({ isActive }) =>
            `group flex items-center gap-4 px-4 py-3 rounded-xl transition-all
            ${
              isActive
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                : "text-slate-600 hover:bg-slate-100"
            }`
          }
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </NavLink>

        <NavLink
          to="/provider/requests"
          className={({ isActive }) =>
            `group flex items-center gap-4 px-4 py-3 rounded-xl transition-all
            ${
              isActive
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                : "text-slate-600 hover:bg-slate-100"
            }`
          }
        >
          <ClipboardList size={20} />
          <span className="font-medium">Requests</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="text-blue-600" />
          <p className="text-sm font-medium text-slate-700">
            You are verified 🎉
          </p>
        </div>
      </div>
    </aside>
  );
};

export default ProviderSidebar;
