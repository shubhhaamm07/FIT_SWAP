import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";

import DashboardPage from "../pages/dashboard/DashboardPage";

import MembershipsPage from "../pages/memberships/MembershipsPage";
import MembershipDetails from "../components/memberships/details/MembershipDetails";

import MarketplacePage from "../pages/Marketplace/MarketplacePage";
import ListingDetailsPage from "../pages/Marketplace/ListingDetailsPage";
import WishlistPage from "../pages/Marketplace/WishlistPage";
import SellMembershipPage from "../pages/Marketplace/SellMembershipPage";
import MyListingsPage from "../pages/Marketplace/MyListingsPage";
import TransferRequestsPage from "../pages/transfers/TransferRequestsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import SettingsPage from "../pages/settings/SettingsPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";
import GymsPage from "../pages/gyms/GymsPage";
import GymDetailsPage from "../pages/gyms/GymDetailsPage";
import GymOwnerDashboardPage from "../pages/gym-owner/GymOwnerDashboardPage";
import GymOwnerOperationsPage from "../pages/gym-owner/GymOwnerOperationsPage";
import AdminPortalPage from "../pages/admin/AdminPortalPage";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage";
import AdminNotificationCentrePage from "../pages/admin/AdminNotificationCentrePage";
import AdminAuditLogsPage from "../pages/admin/AdminAuditLogsPage";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= Public Routes ================= */}

        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* ================= Protected Routes ================= */}

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

        <Route
          path="/marketplace"
          element={
            <ProtectedRoute>
              <MarketplacePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketplace/:listingId"
          element={
            <ProtectedRoute>
              <ListingDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketplace/wishlist"
          element={
            <ProtectedRoute>
              <WishlistPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketplace/sell"
          element={
            <ProtectedRoute>
              <SellMembershipPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/marketplace/my-listings"
          element={
            <ProtectedRoute>
              <MyListingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transfers"
          element={
            <ProtectedRoute>
              <TransferRequestsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gyms"
          element={<ProtectedRoute><GymsPage /></ProtectedRoute>}
        />

        <Route
          path="/gyms/:gymId"
          element={<ProtectedRoute><GymDetailsPage /></ProtectedRoute>}
        />

        <Route
          path="/owner/dashboard"
          element={<RoleRoute allowedRoles={["GYM_OWNER"]}><GymOwnerDashboardPage /></RoleRoute>}
        />

        <Route
          path="/owner/:section"
          element={<RoleRoute allowedRoles={["GYM_OWNER"]}><GymOwnerOperationsPage /></RoleRoute>}
        />

        <Route
          path="/admin/:section"
          element={<RoleRoute allowedRoles={["ADMIN"]}><AdminPortalPage /></RoleRoute>}
        />

        <Route
          path="/admin/analytics"
          element={<RoleRoute allowedRoles={["ADMIN"]}><AdminAnalyticsPage /></RoleRoute>}
        />

        <Route
          path="/admin/announcements"
          element={<RoleRoute allowedRoles={["ADMIN"]}><AdminNotificationCentrePage /></RoleRoute>}
        />

        <Route
          path="/admin/audit-logs"
          element={<RoleRoute allowedRoles={["ADMIN"]}><AdminAuditLogsPage /></RoleRoute>}
        />

        {/* Keep an outdated sidebar URL or a mistyped path from rendering an empty screen. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
