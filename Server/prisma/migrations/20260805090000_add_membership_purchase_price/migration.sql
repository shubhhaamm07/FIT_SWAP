ALTER TABLE "UserMembership"
ADD COLUMN "purchasePrice" DOUBLE PRECISION;

UPDATE "UserMembership" AS membership
SET "purchasePrice" = plan."price"
FROM "MembershipPlan" AS plan
WHERE membership."planId" = plan."id"
  AND membership."purchasePrice" IS NULL;
