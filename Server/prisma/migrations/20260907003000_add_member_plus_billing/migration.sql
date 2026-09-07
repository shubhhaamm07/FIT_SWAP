-- FitSwap Plus is a member-facing subscription. Payments remain manual UPI
-- requests and are only activated after an administrator confirms the UTR.
ALTER TYPE "PlatformPaymentKind" ADD VALUE IF NOT EXISTS 'MEMBER_SUBSCRIPTION';
