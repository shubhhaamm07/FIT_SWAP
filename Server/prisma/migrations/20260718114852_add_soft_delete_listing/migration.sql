-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ListingStatus" ADD VALUE 'DRAFT';
ALTER TYPE "ListingStatus" ADD VALUE 'PAUSED';
ALTER TYPE "ListingStatus" ADD VALUE 'RESERVED';
ALTER TYPE "ListingStatus" ADD VALUE 'PAYMENT_PENDING';
ALTER TYPE "ListingStatus" ADD VALUE 'PAYMENT_SUCCESS';
ALTER TYPE "ListingStatus" ADD VALUE 'PAYMENT_FAILED';
ALTER TYPE "ListingStatus" ADD VALUE 'TRANSFER_PENDING';
ALTER TYPE "ListingStatus" ADD VALUE 'GYM_APPROVAL_PENDING';
ALTER TYPE "ListingStatus" ADD VALUE 'TRANSFER_REJECTED';
ALTER TYPE "ListingStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "MarketplaceListing" ADD COLUMN     "deletedAt" TIMESTAMP(3);
