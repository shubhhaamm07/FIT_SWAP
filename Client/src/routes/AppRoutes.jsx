import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

const LandingPage = lazy(() => import("../pages/LandingPage"));
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmailPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const MembershipsPage = lazy(() => import("../pages/memberships/MembershipsPage"));
const MembershipDetails = lazy(() => import("../components/memberships/details/MembershipDetails"));
const MarketplacePage = lazy(() => import("../pages/Marketplace/MarketplacePage"));
const ListingDetailsPage = lazy(() => import("../pages/Marketplace/ListingDetailsPage"));
const WishlistPage = lazy(() => import("../pages/Marketplace/WishlistPage"));
const SellMembershipPage = lazy(() => import("../pages/Marketplace/SellMembershipPage"));
const MyListingsPage = lazy(() => import("../pages/Marketplace/MyListingsPage"));
const TransferRequestsPage = lazy(() => import("../pages/transfers/TransferRequestsPage"));
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const SettingsPage = lazy(() => import("../pages/settings/SettingsPage"));
const NotificationsPage = lazy(() => import("../pages/notifications/NotificationsPage"));
const GymsPage = lazy(() => import("../pages/gyms/GymsPage"));
const GymDetailsPage = lazy(() => import("../pages/gyms/GymDetailsPage"));
const GymOwnerDashboardPage = lazy(() => import("../pages/gym-owner/GymOwnerDashboardPage"));
const GymOwnerOperationsPage = lazy(() => import("../pages/gym-owner/GymOwnerOperationsPage"));
const AdminPortalPage = lazy(() => import("../pages/admin/AdminPortalPage"));
const AdminAnalyticsPage = lazy(() => import("../pages/admin/AdminAnalyticsPage"));
const AdminNotificationCentrePage = lazy(() => import("../pages/admin/AdminNotificationCentrePage"));
const AdminAuditLogsPage = lazy(() => import("../pages/admin/AdminAuditLogsPage"));

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

function RouteLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#08090d] px-4 text-zinc-300">
      <div className="flex items-center gap-3 text-sm">
        <LoaderCircle className="animate-spin text-violet-400" size={20} />
        Loading FitSwap…
      </div>
    </div>
  );
}

export default AppRoutes;
