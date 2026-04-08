// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSpinner } from "react-icons/fa";

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-white mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // For staff routes, require authentication
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if specified
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'receptionist') {
      return <Navigate to="/receptionist-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};