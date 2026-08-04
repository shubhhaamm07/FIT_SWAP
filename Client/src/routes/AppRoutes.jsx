import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "../pages/LandingPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

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

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= Public Routes ================= */}

        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<RegisterPage />} />

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
          element={<ProtectedRoute><GymOwnerDashboardPage /></ProtectedRoute>}
        />

        <Route
          path="/owner/:section"
          element={<ProtectedRoute><GymOwnerOperationsPage /></ProtectedRoute>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
