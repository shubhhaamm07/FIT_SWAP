CREATE TYPE "SupportTicketCategory" AS ENUM (
  'TRANSFER', 'PAYMENT', 'MEMBERSHIP', 'GYM', 'LISTING', 'ACCOUNT', 'TECHNICAL', 'OTHER'
);

CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TYPE "SupportTicketStatus" AS ENUM (
  'OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'
);

CREATE TYPE "SupportRelatedType" AS ENUM (
  'NONE', 'MEMBERSHIP', 'TRANSFER', 'PAYMENT', 'LISTING', 'GYM', 'TRIAL'
);

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "ticketNumber" TEXT NOT NULL,
  "creatorId" TEXT NOT NULL,
  "assignedToId" TEXT,
  "category" "SupportTicketCategory" NOT NULL,
  "subject" TEXT NOT NULL,
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "relatedType" "SupportRelatedType" NOT NULL DEFAULT 'NONE',
  "relatedEntityId" TEXT,
  "relatedLabel" TEXT,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportMessage" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportAttachment" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "fileKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportAttachment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SupportAttachment_size_check" CHECK ("byteSize" BETWEEN 1 AND 5242880)
);

CREATE TABLE "SupportTicketAuditLog" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  "detail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicketAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");
CREATE INDEX "SupportTicket_creatorId_status_lastMessageAt_idx" ON "SupportTicket"("creatorId", "status", "lastMessageAt");
CREATE INDEX "SupportTicket_assignedToId_status_lastMessageAt_idx" ON "SupportTicket"("assignedToId", "status", "lastMessageAt");
CREATE INDEX "SupportTicket_status_priority_lastMessageAt_idx" ON "SupportTicket"("status", "priority", "lastMessageAt");
CREATE INDEX "SupportTicket_relatedType_relatedEntityId_idx" ON "SupportTicket"("relatedType", "relatedEntityId");
CREATE INDEX "SupportMessage_ticketId_createdAt_idx" ON "SupportMessage"("ticketId", "createdAt");
CREATE UNIQUE INDEX "SupportAttachment_fileKey_key" ON "SupportAttachment"("fileKey");
CREATE INDEX "SupportAttachment_messageId_idx" ON "SupportAttachment"("messageId");
CREATE INDEX "SupportTicketAuditLog_ticketId_createdAt_idx" ON "SupportTicketAuditLog"("ticketId", "createdAt");
CREATE INDEX "SupportTicketAuditLog_actorId_createdAt_idx" ON "SupportTicketAuditLog"("actorId", "createdAt");

ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_creatorId_fkey"
  FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupportAttachment" ADD CONSTRAINT "SupportAttachment_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "SupportMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicketAuditLog" ADD CONSTRAINT "SupportTicketAuditLog_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
