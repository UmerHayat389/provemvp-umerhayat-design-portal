// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, allowedRole, children }) => {
  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Wrong role - redirect based on their actual role
  if (allowedRole && user.role !== allowedRole) {
    const redirectPath = user.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard';
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

export default ProtectedRoute;