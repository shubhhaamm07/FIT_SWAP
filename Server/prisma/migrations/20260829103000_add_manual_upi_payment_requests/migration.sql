-- CreateEnum
CREATE TYPE "UpiPaymentKind" AS ENUM ('GYM_MEMBERSHIP', 'MARKETPLACE_TRANSFER');
-- UpiPaymentStatus is introduced by the preceding platform-billing migration
-- because that migration also needs it for its table default.

-- AlterTable
ALTER TABLE "User" ADD COLUMN "upiId" TEXT;
ALTER TABLE "User" ADD COLUMN "upiPayeeName" TEXT;

-- CreateTable
CREATE TABLE "UpiPaymentRequest" (
    "id" TEXT NOT NULL,
    "kind" "UpiPaymentKind" NOT NULL,
    "status" "UpiPaymentStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "buyerId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "listingId" TEXT,
    "gymId" TEXT,
    "planId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentRef" TEXT NOT NULL,
    "recipientUpiId" TEXT NOT NULL,
    "payeeName" TEXT NOT NULL,
    "utr" TEXT,
    "buyerMarkedPaidAt" TIMESTAMP(3),
    "recipientConfirmedAt" TIMESTAMP(3),
    "gymApprovedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpiPaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UpiPaymentRequest_paymentRef_key" ON "UpiPaymentRequest"("paymentRef");
CREATE INDEX "UpiPaymentRequest_buyerId_status_idx" ON "UpiPaymentRequest"("buyerId", "status");
CREATE INDEX "UpiPaymentRequest_recipientId_status_idx" ON "UpiPaymentRequest"("recipientId", "status");
CREATE INDEX "UpiPaymentRequest_gymId_status_idx" ON "UpiPaymentRequest"("gymId", "status");
CREATE INDEX "UpiPaymentRequest_listingId_status_idx" ON "UpiPaymentRequest"("listingId", "status");
CREATE INDEX "UpiPaymentRequest_expiresAt_idx" ON "UpiPaymentRequest"("expiresAt");

-- AddForeignKey
ALTER TABLE "UpiPaymentRequest" ADD CONSTRAINT "UpiPaymentRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UpiPaymentRequest" ADD CONSTRAINT "UpiPaymentRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UpiPaymentRequest" ADD CONSTRAINT "UpiPaymentRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UpiPaymentRequest" ADD CONSTRAINT "UpiPaymentRequest_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UpiPaymentRequest" ADD CONSTRAINT "UpiPaymentRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
