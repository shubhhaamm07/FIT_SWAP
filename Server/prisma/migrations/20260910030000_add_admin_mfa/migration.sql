-- TOTP secrets are encrypted by the application before storage. Recovery
-- codes are one-way bcrypt hashes, and the last TOTP counter blocks replay.
ALTER TABLE "User"
  ADD COLUMN "adminMfaSecretEncrypted" TEXT,
  ADD COLUMN "adminMfaPendingSecretEncrypted" TEXT,
  ADD COLUMN "adminMfaEnabledAt" TIMESTAMP(3),
  ADD COLUMN "adminMfaRecoveryCodeHashes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "adminMfaLastUsedStep" BIGINT;

ALTER TYPE "AuthTokenType" ADD VALUE IF NOT EXISTS 'ADMIN_MFA_CHALLENGE';
ALTER TABLE "AuthToken" ADD COLUMN "authMethod" "LoginAuthMethod";
