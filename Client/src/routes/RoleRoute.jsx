import { Navigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const homeByRole = {
  ADMIN: "/admin/dashboard",
  GYM_OWNER: "/owner/dashboard",
  USER: "/dashboard",
};

function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0B0B0F] text-white">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={homeByRole[user.role] || "/dashboard"} replace />;
  }

  return children;
}

export default RoleRoute;
