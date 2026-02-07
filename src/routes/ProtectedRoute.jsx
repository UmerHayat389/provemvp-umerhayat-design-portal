import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, allowedRole, children }) => {
  if (!user) return <Navigate to="/" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;