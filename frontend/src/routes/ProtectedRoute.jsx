// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, allowedRole, children }) => {
  // If no user is logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role does not match → redirect to correct dashboard
  if (allowedRole && user.role !== allowedRole) {
    const redirectPath =
      user.role === "Admin"
        ? "/admin/dashboard"
        : "/employee/dashboard";

    return <Navigate to={redirectPath} replace />;
  }

  // Authorized → render the page
  return children;
};

export default ProtectedRoute;