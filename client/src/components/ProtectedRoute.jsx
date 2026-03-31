import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

/**
 * ProtectedRoute — wraps routes that require authentication and/or specific roles.
 *
 * Usage:
 *   <ProtectedRoute>               → any logged-in user
 *   <ProtectedRoute roles={["admin"]}> → admin only
 *   <ProtectedRoute roles={["service_provider"]}> → providers only
 */
const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, token } = useSelector((state) => state.auth);

  // Not logged in at all
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but role not permitted
  if (roles.length > 0 && user && !roles.includes(user.role)) {
    toast.error("You don't have permission to access that page.");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
