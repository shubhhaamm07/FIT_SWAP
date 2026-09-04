DROP INDEX "MembershipExpiryReminder_membershipId_daysBeforeExpiry_channel_key";

CREATE UNIQUE INDEX "MembershipExpiryReminder_membershipId_userId_daysBeforeExpiry_channel_key"
  ON "MembershipExpiryReminder"("membershipId", "userId", "daysBeforeExpiry", "channel");
