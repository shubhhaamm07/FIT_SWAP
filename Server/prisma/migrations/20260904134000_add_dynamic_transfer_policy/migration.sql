-- Per-plan transfer rules. Existing plans retain the previous behavior:
-- transfers need at least 30 days remaining and gym approval by default.
ALTER TABLE "MembershipPlan"
  ADD COLUMN "minimumTransferDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "maximumTransfers" INTEGER,
  ADD COLUMN "requiresGymApproval" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "allowOnlinePayment" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "allowCashTransfer" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "UserMembership"
  ADD COLUMN "transferCount" INTEGER NOT NULL DEFAULT 0;

ALTER TYPE "TransferRequestStatus" ADD VALUE IF NOT EXISTS 'AWAITING_GYM_APPROVAL';

CREATE TABLE "TransferAuditLog" (
  "id" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "listingId" TEXT,
  "actorId" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TransferAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TransferAuditLog_membershipId_createdAt_idx" ON "TransferAuditLog"("membershipId", "createdAt");
CREATE INDEX "TransferAuditLog_listingId_createdAt_idx" ON "TransferAuditLog"("listingId", "createdAt");
CREATE INDEX "TransferAuditLog_actorId_createdAt_idx" ON "TransferAuditLog"("actorId", "createdAt");
CREATE INDEX "TransferAuditLog_action_idx" ON "TransferAuditLog"("action");
