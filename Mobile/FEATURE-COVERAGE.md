# Website-to-mobile coverage

Every route pattern in Client/src/routes/AppRoutes.jsx has an explicit native mapping below. This is a source-coverage audit, not a claim that live database, payment, upload, or device scenarios have all been exercised.

| Website route                | Mobile source                                     |
| ---------------------------- | ------------------------------------------------- |
| `/`                          | `src/pages/auth/AuthPage.tsx`                     |
| `/login`                     | `src/pages/auth/AuthPage.tsx`                     |
| `/register`                  | `src/pages/auth/AuthPage.tsx`                     |
| `/forgot-password`           | `src/pages/auth/AuthPage.tsx`                     |
| `/reset-password`            | `src/pages/auth/AuthPage.tsx`                     |
| `/verify-email`              | `src/pages/auth/AuthPage.tsx`                     |
| `/admin/mfa`                 | `src/pages/auth/AdminMfaPage.tsx`                 |
| `/dashboard`                 | `src/pages/dashboard/DashboardPage.tsx`           |
| `/memberships`               | `src/pages/memberships/MembershipsPage.tsx`       |
| `/memberships/:membershipId` | `src/pages/memberships/MembershipDetailsPage.tsx` |
| `/marketplace`               | `src/pages/marketplace/MarketplacePage.tsx`       |
| `/marketplace/:listingId`    | `src/pages/marketplace/ListingDetailsPage.tsx`    |
| `/marketplace/wishlist`      | `src/pages/marketplace/WishlistPage.tsx`          |
| `/marketplace/sell`          | `src/pages/marketplace/SellMembershipPage.tsx`    |
| `/marketplace/my-listings`   | `src/pages/marketplace/MyListingsPage.tsx`        |
| `/transfers`                 | `src/pages/transfers/TransferRequestsPage.tsx`    |
| `/profile`                   | `src/pages/profile/EditProfilePage.tsx`           |
| `/settings`                  | `src/pages/settings/SettingsPage.tsx`             |
| `/notifications`             | `src/pages/notifications/NotificationsPage.tsx`   |
| `/support`                   | `src/pages/support/SupportTicketsPage.tsx`        |
| `/gyms`                      | `src/pages/gyms/GymsPage.tsx`                     |
| `/gyms/nearby`               | `src/pages/gyms/NearbyGymsPage.tsx`               |
| `/gyms/:gymId`               | `src/pages/gyms/GymDetailsPage.tsx`               |
| `/trials`                    | `src/pages/trials/TrialBookingPage.tsx`           |
| `/diet-planner`              | `src/pages/diet/DietPlannerPage.tsx`              |
| `/wellness`                  | `src/pages/wellness/WellnessPage.tsx`             |
| `/security`                  | `src/pages/security/SecurityCentrePage.tsx`       |
| `/plus`                      | `src/pages/billing/FitSwapPlusPage.tsx`           |
| `/owner/dashboard`           | `src/pages/gym-owner/GymOwnerOperationsPage.tsx`  |
| `/owner/trials`              | `src/pages/gym-owner/OwnerTrialsPage.tsx`         |
| `/owner/:section`            | `src/pages/gym-owner/GymOwnerOperationsPage.tsx`  |
| `/admin/:section`            | `src/pages/admin/AdminPortalPage.tsx`             |
| `/admin/analytics`           | `src/pages/admin/AdminPortalPage.tsx`             |
| `/admin/announcements`       | `src/pages/admin/AdminNotificationCentrePage.tsx` |
| `/admin/audit-logs`          | `src/pages/admin/AdminPortalPage.tsx`             |
| `/admin/transfer-audit`      | `src/pages/admin/AdminPortalPage.tsx`             |
| `/admin/fraud-alerts`        | `src/pages/admin/AdminPortalPage.tsx`             |
| `*`                          | `src/pages/auth/AuthPage.tsx`                     |

## Feature coverage

- Authentication: member/owner registration, password sign-in, native/web Google integration, administrator MFA enrollment and verification, recovery codes, verification resend, email-token verification, password reset, persistent native sessions, and logout.
- Marketplace: server search, location and price filters, sorting, pagination, current-page distance filtering, listing details, saving, eligible listing creation, fair-price guidance, pause/activate/cancel/renew, price updates, paid boosts, and complimentary Plus boosts.
- Payments/transfers: direct-gym UPI checkout, marketplace UPI checkout, request-specific QR/intents, expiry, UTR submission, cancellation, seller receipt/rejection, cash requests and seller confirmation, gym approvals, and transfer history.
- Gyms: partner browsing, galleries, all membership/transfer policies, nearby map and directions, trial discovery and booking/cancellation, crowd reports and Plus crowd history, posts, offers, and winners.
- Wellness: workout create/edit/remove/completion, meal create/edit/remove/adherence, 30-day insights, diet preferences and consent, weekly plans, health-aware review results, meal swaps/logging, and grocery lists.
- Account: profile/details/privacy, avatar/cover uploads, notification preferences, UPI receiving details, security sessions/login history, revocation, password changes, account deletion, support conversations/attachments/status/assignment/reopening, and subscriptions.
- Owner: dashboard, gym create/edit/verification PDF history, gym-image upload/order/primary/delete, post creation/edit/publication/deletion, plans and transfer policies, member memberships, sales/revenue views, trial slots/bookings, handover approvals, audit/risk, receiving payments, and business billing.
- Admin: dashboard, submitted-PDF gym review with concurrency fields, account role/access controls, listing moderation, payment oversight and platform-fee confirmation/rejection, analytics/CSV export, announcements with audience selection, audit/transfer-audit filters, fraud alerts, platform security, and support management.
- Responsive foundation: phone/tablet grids, tablet navigation rail, portrait/landscape layouts, larger text, light/dark/system appearance, contrast/focus preferences, reduced motion, keyboard-aware forms, confirmations, errors/retries, authenticated media, live in-app notifications, and foreground refresh.

## External configuration and release verification

The original API, PostgreSQL/Redis, production email, S3 and scanning configuration, business/recipient UPI accounts, and Google OAuth clients must be configured for real account flows. Native Google sign-in requires a custom native build. The server continues to enforce authorization, entitlement checks, transfer rules, recent authentication, and payment confirmation. No mock replaces those checks for live sign-in.

Email links can be completed on the existing website or through the app's reset/verification token screens; `fitswap://reset-password?token=...` and `fitswap://verify-email?token=...` are handled. Association of a production website domain with the native app requires the real domain and signing setup.

Android/iOS JavaScript export and the web preview are different from signed APK/IPA compilation and real device validation. Real payment, upload, location permission, account, and MFA scenarios remain part of the release checklist. The website does not supply native push notifications; this app implements the existing in-app notification stream and read states.
