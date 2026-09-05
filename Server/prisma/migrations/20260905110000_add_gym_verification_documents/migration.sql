CREATE TYPE "GymVerificationStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'SUPERSEDED');
CREATE TABLE "GymVerificationDocument" (
  "id" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "pageCount" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "status" "GymVerificationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GymVerificationDocument_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GymVerificationDocument_size_check" CHECK ("byteSize" BETWEEN 1 AND 10485760),
  CONSTRAINT "GymVerificationDocument_pages_check" CHECK ("pageCount" BETWEEN 1 AND 25)
);
CREATE UNIQUE INDEX "GymVerificationDocument_fileKey_key" ON "GymVerificationDocument"("fileKey");
CREATE INDEX "GymVerificationDocument_gymId_createdAt_idx" ON "GymVerificationDocument"("gymId", "createdAt");
ALTER TABLE "GymVerificationDocument" ADD CONSTRAINT "GymVerificationDocument_gymId_fkey"
  FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
