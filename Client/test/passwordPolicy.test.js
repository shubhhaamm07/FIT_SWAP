import { expect, test } from "vitest";

import { passwordPolicyMessage } from "../src/utils/passwordPolicy.js";

test("registration accepts a strong password", () => {
  expect(passwordPolicyMessage("StrongPass1!")).toBe("");
});

test("registration enforces the 12-to-128 character password length", () => {
  expect(passwordPolicyMessage("StrongPass1")).toMatch(/at least 12 characters/);
  expect(passwordPolicyMessage(`A1!${"a".repeat(125)}`)).toBe("");
  expect(passwordPolicyMessage(`A1!${"a".repeat(126)}`)).toMatch(/no more than 128 characters/);
});

test("registration requires at least three character groups", () => {
  expect(passwordPolicyMessage("abcdefghijkl1")).toMatch(/at least three/);
  expect(passwordPolicyMessage("abcdefghij1!")).toBe("");
});

test("registration rejects passwords containing the user's identity regardless of case", () => {
  expect(passwordPolicyMessage("StrongALICE9!", { email: "alice@example.com" }))
    .toMatch(/must not contain your name, username, or email address/);
  expect(passwordPolicyMessage("StrongFitUser9!", { username: "fituser" }))
    .toMatch(/must not contain your name, username, or email address/);
});
