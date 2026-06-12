/*
  Warnings:

  - You are about to drop the column `verified` on the `Gym` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "GymStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Gym" DROP COLUMN "verified",
ADD COLUMN     "status" "GymStatus" NOT NULL DEFAULT 'PENDING';
