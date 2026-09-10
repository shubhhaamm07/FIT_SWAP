-- A valid hash chain has only one next entry for a given previous hash.
-- PostgreSQL still permits multiple legacy rows whose previousHash is NULL.
CREATE UNIQUE INDEX "TransferAuditLog_membershipId_previousHash_key"
    ON "TransferAuditLog"("membershipId", "previousHash");
