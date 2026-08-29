-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('MARKETPLACE_TRANSFER', 'GYM_MEMBERSHIP');

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "listingId" DROP NOT NULL;
ALTER TABLE "Payment" ADD COLUMN "planId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "type" "PaymentType" NOT NULL DEFAULT 'MARKETPLACE_TRANSFER';

-- CreateIndex
CREATE INDEX "Payment_planId_idx" ON "Payment"("planId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ensure a member cannot receive the same active plan twice through concurrent payment verification.
CREATE UNIQUE INDEX "UserMembership_userId_planId_active_key"
ON "UserMembership"("userId", "planId")
WHERE "status" = 'ACTIVE';
