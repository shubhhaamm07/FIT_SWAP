# FitSwap security deployment checklist

The application code cannot rotate credentials or edit cloud IAM safely on its
own. Complete these deployment actions before treating the security hardening
as production-ready.

## Required secret rotation

1. Revoke and recreate any AWS, Groq, Brevo, Google, database, UPI-test,
   JWT, or account credential that appeared in a chat, screenshot, log, or commit.
2. Store replacements only in Render/Netlify secret settings. Never use a
   `VITE_` variable for server secrets.
3. Generate independent high-entropy values for `JWT_SECRET`,
   `JWT_REFRESH_SECRET`, and `AUDIT_HMAC_SECRET`.
4. Redeploy, verify login/payment/upload flows, then remove the old keys.

## S3 separation and least privilege

Use separate buckets, or at minimum separate IAM policy statements, for:

- `AWS_GYM_IMAGE_BUCKET_NAME`: public display images under `gyms/*`.
- `AWS_PROFILE_IMAGE_BUCKET_NAME`: private `profile-media/*` objects.
- `AWS_GYM_DOCUMENT_BUCKET_NAME`: private `gym-verification/*` PDFs.
- `AWS_SUPPORT_ATTACHMENT_BUCKET_NAME`: private `support/*` attachments.

The API role should receive only `s3:GetObject`, `s3:PutObject`, and
`s3:DeleteObject` on the exact prefixes it uses. Keep S3 Block Public Access on
for every private bucket. Profile media is delivered by the authenticated API;
do not add a public bucket policy for it.

If profile objects already exist under `profiles/*`, keep
`AWS_PROFILE_IMAGE_BUCKET_NAME` pointed at the old bucket until those objects
have been copied to the private bucket. New uploads use `profile-media/*` and no
longer save a direct S3 URL.

## Shared rate limits

Set `REDIS_URL` in every API instance. Without it, FitSwap deliberately falls
back to a per-instance memory store and logs a production warning. Redis makes
the limits consistent across restarts and horizontally scaled Render services.

The same Redis service now relays in-app notification events between API
instances. SSE continues to work on a single server without Redis, but a
multi-instance Render deployment needs `REDIS_URL` for a notification created
on one instance to reach a browser connected to another instance.

## Database migration

Run `npx prisma migrate deploy` once during the release. The migrations add
persistent idempotency, one-open-marketplace-payment enforcement, exact decimal
pricing, real listing locks, audit hash fields, immutable completed-transfer
records, and database triggers that reject updates/deletes to audit and
settlement evidence.

During this release, verify one UPI reservation through each terminal outcome:
cancelled, rejected, expired, and completed. A cancelled/rejected/expired
reservation must return the listing to `ACTIVE`; a completed transfer must mark
it `SOLD`. Cash handovers always wait for gym-owner confirmation and expire
after seven days if no decision is made.

## Administrator MFA

Administrator TOTP MFA is enforced whenever `NODE_ENV=production`. Before the
first production login, set `MFA_ENCRYPTION_KEY` to a unique 32-byte secret
(64 hex characters or base64-encoded 32 bytes). This encrypts the TOTP secret
at rest; never replace it after administrators enrol, or their authenticator
secrets will become unreadable.

An administrator first signs in with their password or Google account, then
scans the FitSwap QR code in an authenticator app. The setup flow reveals ten
single-use recovery codes once. Store them in an encrypted password manager.
MFA challenges expire after five minutes and each TOTP time-step may be used
only once, which prevents replay within the valid time window.

Sensitive admin mutations still require a login no older than 30 minutes. MFA
for gym owners is a recommended next step, but is not implemented in this
release.

## File scanning and private evidence

Set `CLAMAV_HOST` and `CLAMAV_PORT` to a reachable ClamAV daemon. Set
`MALWARE_SCAN_REQUIRED=true` in any non-production environment that should
also fail closed. Production already fails closed when ClamAV is unavailable.
Gym-verification PDFs and support attachments are stored privately and can be
retrieved only through their authorised API endpoints; do not add a public S3
policy or expose their object URLs.

All profile and gym images are decoded with pixel limits, then rewritten to
bounded WebP, AVIF, and thumbnail variants. This rejects malformed images and
decompression bombs rather than trusting their extension or multipart MIME
type.
