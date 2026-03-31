import React from "react";
import {Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Partner from "./pages/Partner";
import PartnerApplication from "./pages/PartnerApplication";
import MainLayout from "./pages/MainLayout";
import BroadcastRequest from "./pages/BroadcastRequest";
import MyRequests from "./pages/MyRequests";
import AdminDashboard from "./pages/AdminDashboard";
import SearchProviders from "./pages/SearchProvider";
import ProviderDashboard from "./pages/ProviderDasboard";
import ProviderRequest from "./pages/provider/ProviderRequest";
import ProtectedRoute from "./components/ProtectedRoute";

const App=()=>{
  return(
    <>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />

      {/* Provider-only: no MainLayout wrapping needed */}
      <Route path="/pro-requests" element={
        <ProtectedRoute roles={["service_provider"]}>
          <ProviderRequest />
        </ProtectedRoute>
      } />

        <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />

      {/* Admin only */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Provider only */}
      <Route path="/provider/dashboard" element={
        <ProtectedRoute roles={["service_provider"]}>
          <ProviderDashboard />
        </ProtectedRoute>
      } />

      {/* Any logged-in user */}
      <Route path="/search-providers" element={
        <ProtectedRoute>
          <SearchProviders />
        </ProtectedRoute>
      } />
      <Route
          path="/request/:serviceId"
          element={
            <ProtectedRoute>
              <BroadcastRequest />
            </ProtectedRoute>
          }
        />
        <Route path="/my-requests" element={
          <ProtectedRoute>
            <MyRequests />
          </ProtectedRoute>
        } />

      {/* Public (anyone can browse partner info) */}
      <Route path="/partner" element={<Partner />} />
      <Route path="/partner/apply/:professionId" element={<PartnerApplication />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;