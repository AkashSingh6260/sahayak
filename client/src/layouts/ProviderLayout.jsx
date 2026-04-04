import { Outlet } from "react-router-dom";
import ProviderNavbar from "../components/provider/ProviderNavbar";
import ProviderSidebar from "../components/provider/ProviderSidebar";

const ProviderLayout = () => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <ProviderSidebar />

      <div className="flex-1 flex flex-col">
        <ProviderNavbar />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProviderLayout;