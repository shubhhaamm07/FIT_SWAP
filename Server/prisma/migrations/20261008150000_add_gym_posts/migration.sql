CREATE TYPE "GymPostKind" AS ENUM ('UPDATE', 'OFFER', 'EVENT', 'WINNER');

CREATE TABLE "GymPost" (
  "id" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "kind" "GymPostKind" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "offerPrice" DECIMAL(12,2),
  "winnerName" TEXT,
  "posterKey" TEXT,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GymPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GymPost_offerPrice_check" CHECK ("offerPrice" IS NULL OR "offerPrice" > 0),
  CONSTRAINT "GymPost_date_range_check" CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" > "startsAt")
);

CREATE UNIQUE INDEX "GymPost_posterKey_key" ON "GymPost"("posterKey");
CREATE INDEX "GymPost_gymId_isPublished_createdAt_idx" ON "GymPost"("gymId", "isPublished", "createdAt");
CREATE INDEX "GymPost_gymId_endsAt_idx" ON "GymPost"("gymId", "endsAt");

ALTER TABLE "GymPost" ADD CONSTRAINT "GymPost_gymId_fkey"
  FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
