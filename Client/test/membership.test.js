import { expect, test } from "vitest";

import {
  canFreeze,
  canTransfer,
  isActive,
} from "../src/components/memberships/utils/membershipHelpers.js";

test("only an unexpired ACTIVE membership is treated as active", () => {
  expect(isActive("ACTIVE", "2100-01-01T00:00:00Z")).toBe(true);
  expect(isActive("CANCELLED", "2100-01-01T00:00:00Z")).toBe(false);
  expect(isActive("ACTIVE", "2000-01-01T00:00:00Z")).toBe(false);
});

test("freezing requires an active plan that allows it", () => {
  expect(canFreeze({ status: "ACTIVE", plan: { freezeAllowed: true } })).toBe(true);
  expect(canFreeze({ status: "ACTIVE", plan: { freezeAllowed: false } })).toBe(false);
  expect(canFreeze({ status: "CANCELLED", plan: { freezeAllowed: true } })).toBe(false);
});

test("transfers require an active transferable plan", () => {
  expect(canTransfer({ status: "ACTIVE", plan: { transferable: true } })).toBe(true);
  expect(canTransfer({ status: "ACTIVE", plan: { transferable: false } })).toBe(false);
  expect(canTransfer({ status: "EXPIRED", plan: { transferable: true } })).toBe(false);
});
