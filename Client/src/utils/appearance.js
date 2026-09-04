export const APPEARANCE_STORAGE_KEY = "fitswap:appearance:v1";

export const DEFAULT_APPEARANCE = Object.freeze({
  theme: "system",
  reduceMotion: false,
  largeText: false,
  highContrast: false,
  enhancedFocus: true,
});

export const VALID_THEMES = new Set(["light", "dark", "system"]);

export function normalizeAppearance(value) {
  if (!value || typeof value !== "object") return { ...DEFAULT_APPEARANCE };

  return {
    theme: VALID_THEMES.has(value.theme) ? value.theme : DEFAULT_APPEARANCE.theme,
    reduceMotion: Boolean(value.reduceMotion),
    largeText: Boolean(value.largeText),
    highContrast: Boolean(value.highContrast),
    enhancedFocus: value.enhancedFocus !== false,
  };
}

export function readStoredAppearance() {
  if (typeof window === "undefined") return { ...DEFAULT_APPEARANCE };

  try {
    return normalizeAppearance(JSON.parse(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)));
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

export function getSystemPreferences() {
  if (typeof window === "undefined" || !window.matchMedia) {
    return { dark: true, reducedMotion: false };
  }

  return {
    dark: window.matchMedia("(prefers-color-scheme: dark)").matches,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

export function applyAppearanceToDocument(appearance, systemPreferences = getSystemPreferences()) {
  if (typeof document === "undefined") return;

  const normalized = normalizeAppearance(appearance);
  const resolvedTheme = normalized.theme === "system"
    ? (systemPreferences.dark ? "dark" : "light")
    : normalized.theme;
  const effectiveReducedMotion = normalized.reduceMotion || systemPreferences.reducedMotion;
  const root = document.documentElement;

  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = normalized.theme;
  root.dataset.reducedMotion = String(effectiveReducedMotion);
  root.dataset.largeText = String(normalized.largeText);
  root.dataset.highContrast = String(normalized.highContrast);
  root.dataset.focusIndicators = normalized.enhancedFocus ? "enhanced" : "standard";
  root.style.colorScheme = resolvedTheme;
}

export function initializeAppearance() {
  const appearance = readStoredAppearance();
  applyAppearanceToDocument(appearance);
  return appearance;
}

