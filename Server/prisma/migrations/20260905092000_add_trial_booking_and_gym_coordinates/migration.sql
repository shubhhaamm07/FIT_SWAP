ALTER TABLE "Gym"
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION;

ALTER TABLE "Gym"
  ADD CONSTRAINT "Gym_coordinates_pair_check"
  CHECK (
    ("latitude" IS NULL AND "longitude" IS NULL)
    OR (
      "latitude" BETWEEN -90 AND 90
      AND "longitude" BETWEEN -180 AND 180
    )
  );

CREATE TYPE "TrialBookingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED'
);

CREATE TABLE "GymTrialSlot" (
  "id" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "capacity" INTEGER NOT NULL,
  "bookedCount" INTEGER NOT NULL DEFAULT 0,
  "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GymTrialSlot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GymTrialSlot_schedule_check" CHECK ("endAt" > "startAt"),
  CONSTRAINT "GymTrialSlot_capacity_check" CHECK ("capacity" BETWEEN 1 AND 100),
  CONSTRAINT "GymTrialSlot_booked_count_check" CHECK ("bookedCount" BETWEEN 0 AND "capacity")
);

CREATE TABLE "GymTrialBooking" (
  "id" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "TrialBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
  "bookingReference" TEXT NOT NULL,
  "cancellationReason" TEXT,
  "completedAt" TIMESTAMP(3),
  "noShowAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "lastUpdatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GymTrialBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GymTrialSlot_gymId_startAt_endAt_key"
  ON "GymTrialSlot"("gymId", "startAt", "endAt");
CREATE INDEX "GymTrialSlot_gymId_isActive_startAt_idx"
  ON "GymTrialSlot"("gymId", "isActive", "startAt");

CREATE UNIQUE INDEX "GymTrialBooking_bookingReference_key"
  ON "GymTrialBooking"("bookingReference");
CREATE UNIQUE INDEX "GymTrialBooking_slotId_userId_key"
  ON "GymTrialBooking"("slotId", "userId");
CREATE INDEX "GymTrialBooking_userId_status_idx"
  ON "GymTrialBooking"("userId", "status");
CREATE INDEX "GymTrialBooking_slotId_status_idx"
  ON "GymTrialBooking"("slotId", "status");
CREATE INDEX "GymTrialBooking_createdAt_idx"
  ON "GymTrialBooking"("createdAt");

ALTER TABLE "GymTrialSlot"
  ADD CONSTRAINT "GymTrialSlot_gymId_fkey"
  FOREIGN KEY ("gymId") REFERENCES "Gym"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GymTrialBooking"
  ADD CONSTRAINT "GymTrialBooking_slotId_fkey"
  FOREIGN KEY ("slotId") REFERENCES "GymTrialSlot"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GymTrialBooking"
  ADD CONSTRAINT "GymTrialBooking_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
