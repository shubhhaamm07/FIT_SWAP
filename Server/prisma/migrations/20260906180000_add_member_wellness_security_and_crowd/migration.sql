CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER');
CREATE TYPE "MealLogSource" AS ENUM ('AI_PLAN', 'MANUAL');
CREATE TYPE "LoginAuthMethod" AS ENUM ('PASSWORD', 'GOOGLE');
CREATE TYPE "LoginAuditStatus" AS ENUM ('SUCCESS', 'FAILURE');
CREATE TYPE "LoginRiskLevel" AS ENUM ('NONE', 'NEW_DEVICE', 'SUSPICIOUS');
CREATE TYPE "CrowdLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "WorkoutSchedule" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekday" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "focus" TEXT,
  "durationMinutes" INTEGER,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkoutSchedule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkoutSchedule_weekday_check" CHECK ("weekday" BETWEEN 1 AND 7),
  CONSTRAINT "WorkoutSchedule_duration_check" CHECK ("durationMinutes" IS NULL OR "durationMinutes" BETWEEN 5 AND 300)
);

CREATE TABLE "WorkoutCompletion" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "completedOn" DATE NOT NULL,
  "durationMinutes" INTEGER,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkoutCompletion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkoutCompletion_duration_check" CHECK ("durationMinutes" IS NULL OR "durationMinutes" BETWEEN 1 AND 600)
);

CREATE TABLE "MealLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mealDate" DATE NOT NULL,
  "mealType" "MealType" NOT NULL DEFAULT 'OTHER',
  "label" TEXT NOT NULL,
  "description" TEXT,
  "estimatedCalories" INTEGER,
  "source" "MealLogSource" NOT NULL DEFAULT 'MANUAL',
  "isFollowed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MealLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MealLog_calories_check" CHECK ("estimatedCalories" IS NULL OR "estimatedCalories" BETWEEN 0 AND 3000)
);

CREATE TABLE "UserSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "deviceName" TEXT NOT NULL,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "authMethod" "LoginAuthMethod" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "revokedReason" TEXT,
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LoginAudit" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "email" TEXT,
  "deviceName" TEXT,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "authMethod" "LoginAuthMethod",
  "status" "LoginAuditStatus" NOT NULL,
  "riskLevel" "LoginRiskLevel" NOT NULL DEFAULT 'NONE',
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LoginAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PasswordChangeAudit" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "deviceName" TEXT,
  "ipAddress" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordChangeAudit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GymCrowdReport" (
  "id" TEXT NOT NULL,
  "gymId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "level" "CrowdLevel" NOT NULL,
  "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GymCrowdReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkoutSchedule_userId_weekday_isActive_idx" ON "WorkoutSchedule"("userId", "weekday", "isActive");
CREATE UNIQUE INDEX "WorkoutCompletion_scheduleId_completedOn_key" ON "WorkoutCompletion"("scheduleId", "completedOn");
CREATE INDEX "WorkoutCompletion_userId_completedOn_idx" ON "WorkoutCompletion"("userId", "completedOn");
CREATE INDEX "MealLog_userId_mealDate_idx" ON "MealLog"("userId", "mealDate");
CREATE INDEX "UserSession_userId_revokedAt_expiresAt_idx" ON "UserSession"("userId", "revokedAt", "expiresAt");
CREATE INDEX "LoginAudit_userId_createdAt_idx" ON "LoginAudit"("userId", "createdAt");
CREATE INDEX "LoginAudit_email_createdAt_idx" ON "LoginAudit"("email", "createdAt");
CREATE INDEX "PasswordChangeAudit_userId_changedAt_idx" ON "PasswordChangeAudit"("userId", "changedAt");
CREATE INDEX "GymCrowdReport_gymId_expiresAt_idx" ON "GymCrowdReport"("gymId", "expiresAt");
CREATE INDEX "GymCrowdReport_userId_reportedAt_idx" ON "GymCrowdReport"("userId", "reportedAt");
CREATE UNIQUE INDEX "GymCrowdReport_gymId_userId_key" ON "GymCrowdReport"("gymId", "userId");

ALTER TABLE "WorkoutSchedule" ADD CONSTRAINT "WorkoutSchedule_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutCompletion" ADD CONSTRAINT "WorkoutCompletion_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutCompletion" ADD CONSTRAINT "WorkoutCompletion_scheduleId_fkey"
  FOREIGN KEY ("scheduleId") REFERENCES "WorkoutSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MealLog" ADD CONSTRAINT "MealLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LoginAudit" ADD CONSTRAINT "LoginAudit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PasswordChangeAudit" ADD CONSTRAINT "PasswordChangeAudit_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GymCrowdReport" ADD CONSTRAINT "GymCrowdReport_gymId_fkey"
  FOREIGN KEY ("gymId") REFERENCES "Gym"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GymCrowdReport" ADD CONSTRAINT "GymCrowdReport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
