-- One complimentary FitSwap Plus listing boost can be redeemed per member and
-- calendar month. PostgreSQL permits multiple NULL values, so paid requests
-- (which leave benefitMonth NULL) retain their normal lifecycle.
ALTER TABLE "PlatformPaymentRequest"
ADD COLUMN "benefitMonth" TIMESTAMP(3);

CREATE UNIQUE INDEX "PlatformPaymentRequest_buyerId_planCode_benefitMonth_key"
ON "PlatformPaymentRequest"("buyerId", "planCode", "benefitMonth");
