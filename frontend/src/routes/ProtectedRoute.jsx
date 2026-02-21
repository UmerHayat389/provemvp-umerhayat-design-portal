// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, allowedRole, children }) => {
  // Try to get user from localStorage if not passed as prop
  const savedUser = !user ? JSON.parse(localStorage.getItem("user")) : user;

  // Not logged in - redirect to login
  if (!savedUser) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role - redirect based on their actual role
  if (allowedRole && savedUser.role !== allowedRole) {
    const redirectPath = savedUser.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
