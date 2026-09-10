-- Profile media is private and served only through authenticated API routes.
-- Removing these columns prevents future code from accidentally returning a
-- directly usable public S3 URL and clears legacy URL values at the same time.
ALTER TABLE "User"
    DROP COLUMN "avatarUrl",
    DROP COLUMN "coverUrl";
