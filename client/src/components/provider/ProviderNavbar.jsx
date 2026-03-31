import { LogOut, Bell } from "lucide-react";

const ProviderNavbar = () => {
  return (
    <header className="h-16 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-8">
      <h1 className="text-lg font-semibold text-slate-800">
        Service Provider Dashboard
      </h1>

      <div className="flex items-center gap-6">
        <button className="relative text-slate-600 hover:text-blue-600 transition">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
};

export default ProviderNavbar;
