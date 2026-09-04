import { useCallback, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";

import { AppearanceContext } from "./appearance-context";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
  VALID_THEMES,
  applyAppearanceToDocument,
  getSystemPreferences,
  readStoredAppearance,
} from "../utils/appearance";

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(readStoredAppearance);
  const [systemPreferences, setSystemPreferences] = useState(getSystemPreferences);

  useEffect(() => {
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncSystemPreferences = () => {
      setSystemPreferences({ dark: darkQuery.matches, reducedMotion: motionQuery.matches });
    };

    darkQuery.addEventListener("change", syncSystemPreferences);
    motionQuery.addEventListener("change", syncSystemPreferences);

    return () => {
      darkQuery.removeEventListener("change", syncSystemPreferences);
      motionQuery.removeEventListener("change", syncSystemPreferences);
    };
  }, []);

  useEffect(() => {
    applyAppearanceToDocument(appearance, systemPreferences);

    try {
      window.localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      // The settings still work for this visit when browser storage is unavailable.
    }
  }, [appearance, systemPreferences]);

  const setTheme = useCallback((theme) => {
    if (!VALID_THEMES.has(theme)) return;
    setAppearance((current) => ({ ...current, theme }));
  }, []);

  const setAccessibilityPreference = useCallback((key, enabled) => {
    if (!["reduceMotion", "largeText", "highContrast", "enhancedFocus"].includes(key)) return;
    setAppearance((current) => ({ ...current, [key]: Boolean(enabled) }));
  }, []);

  const resetAppearance = useCallback(() => {
    setAppearance({ ...DEFAULT_APPEARANCE });
  }, []);

  const value = useMemo(() => ({
    appearance,
    resolvedTheme: appearance.theme === "system"
      ? (systemPreferences.dark ? "dark" : "light")
      : appearance.theme,
    effectiveReducedMotion: appearance.reduceMotion || systemPreferences.reducedMotion,
    systemPrefersReducedMotion: systemPreferences.reducedMotion,
    setTheme,
    setAccessibilityPreference,
    resetAppearance,
  }), [appearance, resetAppearance, setAccessibilityPreference, setTheme, systemPreferences]);

  return (
    <AppearanceContext.Provider value={value}>
      <MotionConfig reducedMotion={value.effectiveReducedMotion ? "always" : "user"}>
        {children}
      </MotionConfig>
    </AppearanceContext.Provider>
  );
}
