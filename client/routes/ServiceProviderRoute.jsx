import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ServiceProviderRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

 
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }


  if (user.role !== "service_provider") {
    return <Navigate to="/" replace />;
  }

  
  return children;
};

export default ServiceProviderRoute;
