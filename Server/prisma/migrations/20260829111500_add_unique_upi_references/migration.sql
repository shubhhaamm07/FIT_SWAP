-- A UTR/reference is issued for a single bank or UPI payment.  Keep a
-- database-level guard in addition to the service-level duplicate checks.
-- PostgreSQL allows multiple NULL values in a unique index, so unpaid
-- requests remain unaffected.
CREATE UNIQUE INDEX "UpiPaymentRequest_utr_key"
ON "UpiPaymentRequest"("utr");

CREATE UNIQUE INDEX "PlatformPaymentRequest_utr_key"
ON "PlatformPaymentRequest"("utr");
