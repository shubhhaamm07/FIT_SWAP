// @vitest-environment jsdom

import { afterEach, expect, test } from "vitest";

import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  applyAppearanceToDocument,
  normalizeAppearance,
  readStoredAppearance,
} from "../src/utils/appearance.js";

afterEach(() => {
  window.localStorage.clear();
});

test("invalid saved appearance falls back to safe defaults", () => {
  window.localStorage.setItem(APPEARANCE_STORAGE_KEY, "not valid JSON");
  expect(readStoredAppearance()).toEqual(DEFAULT_APPEARANCE);
  expect(normalizeAppearance({ theme: "unknown", enhancedFocus: false })).toMatchObject({
    theme: "system",
    enhancedFocus: false,
  });
});

test("system preferences and accessibility choices reach the document", () => {
  applyAppearanceToDocument(
    { theme: "system", largeText: true, enhancedFocus: false },
    { dark: false, reducedMotion: true },
  );

  expect(document.documentElement.dataset.theme).toBe("light");
  expect(document.documentElement.dataset.reducedMotion).toBe("true");
  expect(document.documentElement.dataset.largeText).toBe("true");
  expect(document.documentElement.dataset.focusIndicators).toBe("standard");
});
