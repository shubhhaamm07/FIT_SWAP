import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import DashboardPage from "../pages/dashboard/DashboardPage";
import MembershipsPage from "../pages/memberships/MembershipsPage";

import MembershipDetails from "../components/memberships/details/MembershipDetails";

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}

        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/memberships"
          element={
            <ProtectedRoute>
              <MembershipsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/memberships/:membershipId"
          element={
            <ProtectedRoute>
              <MembershipDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
