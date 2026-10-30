# Validation and release checklist

## Completed in this workspace

- TypeScript checks of the expanded application.
- 13 mobile tests: role access, coordinates/distances, responsive layout boundaries and accessibility text density, secure storage/bearer handling, web cookies, multipart headers/idempotency, session expiry, preview isolation, error preservation, and price/date formatting.
- 12 API-controller regression tests: native member/owner sign-in, native administrator MFA challenge and verification, recovery-code handling, invalid MFA rejection, native Google member/admin behavior, website cookie/MFA preservation, failed credentials, and sanitized session errors.
- A route coverage audit against the current `Client/src/routes/AppRoutes.jsx`: 38 mapped patterns, no missing native files, and no unmapped website patterns. This audit proves source mapping, not successful execution of every action.
- Final Android, iOS, and web production JavaScript exports passed after the last code changes.
- Browser inspection of member dashboard/navigation, marketplace and membership flows, wellness forms, the animated 3D artwork, owner dashboard/gym setup, administrator gym review and analytics, and themed keyboard-aware scrollable form dialogs.
- All 42 backend tests passed in the installed FitSwap repository, including the 12 mobile/website authentication regression tests. Installed mobile TypeScript, all 13 tests, website route parity, and Git whitespace checks passed.
- The expanded source and dependencies are installed in `FitSwap/Mobile`. No changes to the first app snapshot were overwritten; the snapshot was compared before installation.

## Required before a production release

- Build signed native applications with the project’s real identifiers and credentials; test on at least one Android and one iOS device, plus a tablet and rotated layouts.
- Run live member/owner/admin account scenarios against a test database, including expired/revoked sessions and password changes.
- Configure Google OAuth IDs, redirect URLs, and signing fingerprints; test native/web Google sign-in and administrator MFA enrollment, recovery, expiry, and rejection.
- Configure test SMTP, Redis, image/document storage and malware scanning; exercise profile/gym uploads, protected downloads, PDF review, and support attachments with allowed and rejected files.
- Exercise direct membership and marketplace UPI requests, exact paise/rupee totals, UTR submission, cancellation/expiry, recipient confirmation/rejection, cash handovers, and gym approvals using a test payment workflow.
- Exercise trial capacity/concurrency, cancellations, owner attendance/status updates, transfer eligibility/freeze limits, listing renewal/boosts, and entitlement-locked features.
- Verify AI consent and health-aware diet responses, meal swaps, logging, wellness privacy, and permission denial paths.
- Review current upstream dependency advisories and store/build requirements before shipping.

No real account deletion, announcement broadcast, payment, transfer, or production administrative mutation was performed while building this app. Preview mode is intentionally read-only.
