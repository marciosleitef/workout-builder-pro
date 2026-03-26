import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipPasswordCheck?: boolean;
  allowedRole?: "professor" | "student";
}

const ProtectedRoute = ({ children, skipPasswordCheck, allowedRole }: ProtectedRouteProps) => {
  const { user, loading, mustChangePassword, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!skipPasswordCheck && mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  // Role-based redirection
  if (role && allowedRole && role !== allowedRole) {
    if (role === "student") {
      return <Navigate to="/student-dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
