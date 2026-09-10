-- Re-listing must create a new listing record rather than being blocked by a
-- historical cancelled, expired, or sold listing.
DROP INDEX IF EXISTS "MarketplaceListing_membershipId_key";
CREATE INDEX "MarketplaceListing_membershipId_status_idx"
  ON "MarketplaceListing"("membershipId", "status");
CREATE UNIQUE INDEX "MarketplaceListing_one_open_membership_idx"
  ON "MarketplaceListing"("membershipId")
  WHERE "deletedAt" IS NULL
    AND "status" NOT IN ('SOLD', 'CANCELLED', 'EXPIRED');

-- A buyer may try again after a terminal outcome, but cannot open duplicate
-- concurrent cash requests for the same listing.
DROP INDEX IF EXISTS "TransferRequest_listingId_buyerId_key";
ALTER TABLE "TransferRequest"
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "closeReason" TEXT;
UPDATE "TransferRequest"
SET "expiresAt" = COALESCE("expiresAt", "createdAt" + INTERVAL '7 days');
ALTER TABLE "TransferRequest"
  ALTER COLUMN "expiresAt" SET NOT NULL;
CREATE INDEX "TransferRequest_listingId_buyerId_idx"
  ON "TransferRequest"("listingId", "buyerId");
CREATE INDEX "TransferRequest_status_expiresAt_idx"
  ON "TransferRequest"("status", "expiresAt");
CREATE UNIQUE INDEX "TransferRequest_one_open_per_buyer_listing_idx"
  ON "TransferRequest"("listingId", "buyerId")
  WHERE "status" IN ('PENDING', 'AWAITING_GYM_APPROVAL');

-- Persist real listing locks used by marketplace mutation rules.
ALTER TABLE "MarketplaceListing"
  ADD COLUMN "isLocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lockType" TEXT,
  ADD COLUMN "lockedAt" TIMESTAMP(3);

-- Store money as exact decimal values. UPI settlement amounts remain integer
-- paise, which avoids any floating-point calculations during payment flows.
ALTER TABLE "MembershipPlan"
  ALTER COLUMN "price" TYPE DECIMAL(12, 2) USING ROUND("price"::numeric, 2),
  ALTER COLUMN "transferFee" TYPE DECIMAL(12, 2) USING CASE WHEN "transferFee" IS NULL THEN NULL ELSE ROUND("transferFee"::numeric, 2) END;
ALTER TABLE "UserMembership"
  ALTER COLUMN "purchasePrice" TYPE DECIMAL(12, 2) USING CASE WHEN "purchasePrice" IS NULL THEN NULL ELSE ROUND("purchasePrice"::numeric, 2) END;
ALTER TABLE "MarketplaceListing"
  ALTER COLUMN "askingPrice" TYPE DECIMAL(12, 2) USING ROUND("askingPrice"::numeric, 2);

CREATE TABLE "MembershipTransfer" (
  "id" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "amountPaise" INTEGER NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "paymentReference" TEXT,
  "sellerConfirmedAt" TIMESTAMP(3),
  "gymApprovedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MembershipTransfer_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MembershipTransfer_amountPaise_check" CHECK ("amountPaise" > 0)
);
CREATE UNIQUE INDEX "MembershipTransfer_listingId_key" ON "MembershipTransfer"("listingId");
CREATE INDEX "MembershipTransfer_membershipId_completedAt_idx" ON "MembershipTransfer"("membershipId", "completedAt");
CREATE INDEX "MembershipTransfer_sellerId_completedAt_idx" ON "MembershipTransfer"("sellerId", "completedAt");
CREATE INDEX "MembershipTransfer_buyerId_completedAt_idx" ON "MembershipTransfer"("buyerId", "completedAt");
ALTER TABLE "MembershipTransfer"
  ADD CONSTRAINT "MembershipTransfer_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "UserMembership"("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  ADD CONSTRAINT "MembershipTransfer_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON UPDATE CASCADE ON DELETE RESTRICT;

-- Settlement evidence must remain immutable once ownership changes.
CREATE TRIGGER "MembershipTransfer_append_only"
BEFORE UPDATE OR DELETE ON "MembershipTransfer"
FOR EACH ROW EXECUTE FUNCTION fitswap_reject_audit_mutation();
