import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";


const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, token } = useSelector((state) => state.auth);

  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

 
  if (roles.length > 0 && user && !roles.includes(user.role)) {
    toast.error("You don't have permission to access that page.");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
