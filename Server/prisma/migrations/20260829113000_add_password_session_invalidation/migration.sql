-- Password resets and password changes invalidate JWTs issued earlier.
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
