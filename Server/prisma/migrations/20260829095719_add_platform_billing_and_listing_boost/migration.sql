-- CreateEnum
-- This enum is shared by the manual-UPI and platform-fee workflows.  The
-- platform billing migration is ordered first, so it owns the enum creation.
CREATE TYPE "UpiPaymentStatus" AS ENUM ('AWAITING_PAYMENT', 'BUYER_MARKED_PAID', 'AWAITING_GYM_APPROVAL', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'DISPUTED');
CREATE TYPE "PlatformPaymentKind" AS ENUM ('OWNER_SUBSCRIPTION', 'LISTING_BOOST');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAuditAction" ADD VALUE 'PLATFORM_PAYMENT_CONFIRMED';
ALTER TYPE "AdminAuditAction" ADD VALUE 'PLATFORM_PAYMENT_REJECTED';

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_listingId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_planId_fkey";

-- AlterTable
ALTER TABLE "MarketplaceListing" ADD COLUMN     "boostedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PlatformPaymentRequest" (
    "id" TEXT NOT NULL,
    "kind" "PlatformPaymentKind" NOT NULL,
    "status" "UpiPaymentStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "planCode" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT,
    "confirmedByAdminId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "paymentRef" TEXT NOT NULL,
    "platformUpiId" TEXT NOT NULL,
    "platformPayeeName" TEXT NOT NULL,
    "benefitDays" INTEGER NOT NULL,
    "benefitExpiresAt" TIMESTAMP(3),
    "utr" TEXT,
    "buyerMarkedPaidAt" TIMESTAMP(3),
    "adminConfirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformPaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPaymentRequest_paymentRef_key" ON "PlatformPaymentRequest"("paymentRef");

-- CreateIndex
CREATE INDEX "PlatformPaymentRequest_buyerId_status_idx" ON "PlatformPaymentRequest"("buyerId", "status");

-- CreateIndex
CREATE INDEX "PlatformPaymentRequest_listingId_status_idx" ON "PlatformPaymentRequest"("listingId", "status");

-- CreateIndex
CREATE INDEX "PlatformPaymentRequest_status_idx" ON "PlatformPaymentRequest"("status");

-- CreateIndex
CREATE INDEX "PlatformPaymentRequest_expiresAt_idx" ON "PlatformPaymentRequest"("expiresAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPaymentRequest" ADD CONSTRAINT "PlatformPaymentRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPaymentRequest" ADD CONSTRAINT "PlatformPaymentRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformPaymentRequest" ADD CONSTRAINT "PlatformPaymentRequest_confirmedByAdminId_fkey" FOREIGN KEY ("confirmedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
