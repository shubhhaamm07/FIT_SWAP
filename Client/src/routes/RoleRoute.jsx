import { Navigate, useLocation } from "react-router-dom";
import { signInPath } from "../utils/signInPath";

import { useAuth } from "../hooks/useAuth";

const homeByRole = {
  ADMIN: "/admin/dashboard",
  GYM_OWNER: "/owner/dashboard",
  USER: "/dashboard",
};

function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0B0B0F] text-white">Loading...</div>;
  }

  if (!user) return <Navigate to={signInPath(location.pathname + location.search)} replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={homeByRole[user.role] || "/dashboard"} replace />;
  }

  return children;
}

export default RoleRoute;
