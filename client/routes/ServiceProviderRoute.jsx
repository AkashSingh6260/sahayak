import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ServiceProviderRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not a service provider
  if (user.role !== "service_provider") {
    return <Navigate to="/" replace />;
  }

  // Authorized service provider
  return children;
};

export default ServiceProviderRoute;
