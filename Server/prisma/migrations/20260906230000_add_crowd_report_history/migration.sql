CREATE TABLE "GymCrowdReportHistory" (
  "id" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "level" "CrowdLevel" NOT NULL,
  "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GymCrowdReportHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GymCrowdReportHistory_gymId_reportedAt_idx" ON "GymCrowdReportHistory"("gymId", "reportedAt");
CREATE INDEX "GymCrowdReportHistory_userId_reportedAt_idx" ON "GymCrowdReportHistory"("userId", "reportedAt");

ALTER TABLE "GymCrowdReportHistory" ADD CONSTRAINT "GymCrowdReportHistory_gymId_fkey"
  FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GymCrowdReportHistory" ADD CONSTRAINT "GymCrowdReportHistory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
