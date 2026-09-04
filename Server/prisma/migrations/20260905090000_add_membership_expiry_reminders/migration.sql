ALTER TABLE "User"
  ADD COLUMN "membershipExpiryNotifications" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "membershipExpiryEmailNotifications" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "MembershipExpiryReminderChannel" AS ENUM ('IN_APP', 'EMAIL');
CREATE TYPE "MembershipExpiryReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "MembershipExpiryReminder" (
  "id" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "daysBeforeExpiry" INTEGER NOT NULL,
  "channel" "MembershipExpiryReminderChannel" NOT NULL,
  "status" "MembershipExpiryReminderStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 1,
  "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MembershipExpiryReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipExpiryReminder_membershipId_daysBeforeExpiry_channel_key"
  ON "MembershipExpiryReminder"("membershipId", "daysBeforeExpiry", "channel");
CREATE INDEX "MembershipExpiryReminder_userId_createdAt_idx"
  ON "MembershipExpiryReminder"("userId", "createdAt");
CREATE INDEX "MembershipExpiryReminder_status_lastAttemptAt_idx"
  ON "MembershipExpiryReminder"("status", "lastAttemptAt");

ALTER TABLE "MembershipExpiryReminder"
  ADD CONSTRAINT "MembershipExpiryReminder_membershipId_fkey"
  FOREIGN KEY ("membershipId") REFERENCES "UserMembership"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MembershipExpiryReminder"
  ADD CONSTRAINT "MembershipExpiryReminder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
