-- Persistent idempotency records prevent duplicate money and workflow writes
-- across retries, deployments, and multiple API instances.
CREATE TABLE "IdempotencyRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IdempotencyRecord_userId_scope_key_key"
    ON "IdempotencyRecord"("userId", "scope", "key");
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- Keep the most advanced marketplace request if historical concurrency already
-- produced duplicates, then prevent more than one open request per listing.
WITH ranked_open_requests AS (
    SELECT "id", ROW_NUMBER() OVER (
        PARTITION BY "listingId"
        ORDER BY CASE "status"
            WHEN 'DISPUTED' THEN 1
            WHEN 'AWAITING_GYM_APPROVAL' THEN 2
            WHEN 'BUYER_MARKED_PAID' THEN 3
            ELSE 4
        END, "createdAt" ASC
    ) AS position
    FROM "UpiPaymentRequest"
    WHERE "kind" = 'MARKETPLACE_TRANSFER'
      AND "listingId" IS NOT NULL
      AND "status" IN ('AWAITING_PAYMENT', 'BUYER_MARKED_PAID', 'AWAITING_GYM_APPROVAL', 'DISPUTED')
)
UPDATE "UpiPaymentRequest"
SET "status" = 'EXPIRED',
    "rejectionReason" = COALESCE("rejectionReason", 'Closed while applying the single-open-payment security rule.'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN (SELECT "id" FROM ranked_open_requests WHERE position > 1);

CREATE UNIQUE INDEX "UpiPaymentRequest_one_open_marketplace_listing_idx"
    ON "UpiPaymentRequest"("listingId")
    WHERE "kind" = 'MARKETPLACE_TRANSFER'
      AND "listingId" IS NOT NULL
      AND "status" IN ('AWAITING_PAYMENT', 'BUYER_MARKED_PAID', 'AWAITING_GYM_APPROVAL', 'DISPUTED');

ALTER TABLE "TransferAuditLog"
    ADD COLUMN "previousHash" TEXT,
    ADD COLUMN "entryHash" TEXT,
    ADD COLUMN "integrityNonce" TEXT,
    ADD COLUMN "integrityVersion" INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX "TransferAuditLog_entryHash_key" ON "TransferAuditLog"("entryHash");

-- Audit history is append-only at database level. Application roles cannot
-- silently rewrite or delete evidence after a transfer or admin action.
CREATE OR REPLACE FUNCTION fitswap_reject_audit_mutation()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'FitSwap audit records are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "TransferAuditLog_append_only"
BEFORE UPDATE OR DELETE ON "TransferAuditLog"
FOR EACH ROW EXECUTE FUNCTION fitswap_reject_audit_mutation();

CREATE TRIGGER "AdminAuditLog_append_only"
BEFORE UPDATE OR DELETE ON "AdminAuditLog"
FOR EACH ROW EXECUTE FUNCTION fitswap_reject_audit_mutation();
