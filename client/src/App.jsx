import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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
import ChatWidget from "./components/ChatWidget";
import SOSButton from "./components/SOSButton";

// Pages where chatbot should NOT appear
const HIDE_CHAT_ON = ["/login", "/register"];

const App = () => {
  const location = useLocation();
  const showChat = !HIDE_CHAT_ON.includes(location.pathname);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="/pro-requests" element={
          <ProtectedRoute roles={["service_provider"]}>
            <ProviderRequest />
          </ProtectedRoute>
        } />
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/provider/dashboard" element={
            <ProtectedRoute roles={["service_provider"]}>
              <ProviderDashboard />
            </ProtectedRoute>
          } />
          <Route path="/search-providers" element={
            <ProtectedRoute>
              <SearchProviders />
            </ProtectedRoute>
          } />
          <Route path="/request/:serviceId" element={
            <ProtectedRoute>
              <BroadcastRequest />
            </ProtectedRoute>
          } />
          <Route path="/my-requests" element={
            <ProtectedRoute>
              <MyRequests />
            </ProtectedRoute>
          } />
          <Route path="/partner" element={<Partner />} />
          <Route path="/partner/apply/:professionId" element={<PartnerApplication />} />
        </Route>
      </Routes>

      {/* Floating chatbot — shown on all pages except login/register */}
      {showChat && <ChatWidget />}

      {/* Floating SOS button — shown globally, self-hides for admin/provider */}
      {showChat && <SOSButton />}
    </>
  );
};

export default App;