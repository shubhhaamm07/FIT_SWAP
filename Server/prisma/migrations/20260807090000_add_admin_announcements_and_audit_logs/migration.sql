CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL_USERS', 'MEMBERS', 'GYM_OWNERS', 'SELECTED_USERS');

CREATE TYPE "AdminAuditAction" AS ENUM ('ANNOUNCEMENT_SENT', 'GYM_STATUS_UPDATED', 'LISTING_STATUS_UPDATED', 'USER_ROLE_UPDATED', 'TRANSFER_RESOLVED');

CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "audience" "AnnouncementAudience" NOT NULL,
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" "AdminAuditAction" NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
CREATE INDEX "Announcement_audience_idx" ON "Announcement"("audience");
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

ALTER TABLE "Announcement"
  ADD CONSTRAINT "Announcement_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminAuditLog"
  ADD CONSTRAINT "AdminAuditLog_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
