import { Navigate, useLocation } from "react-router-dom";
import { signInPath } from "../utils/signInPath";
import { useAuth } from "../hooks/useAuth";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={signInPath(location.pathname + location.search)} replace />;
  }

  return children;
}

export default ProtectedRoute;
