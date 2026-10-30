import AsyncStorage from "@react-native-async-storage/async-storage";
import { rem, vars } from "nativewind";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AccessibilityInfo, useColorScheme, View } from "react-native";
type Appearance = {
  theme: "system" | "dark" | "light";
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  enhancedFocus: boolean;
};
const defaults: Appearance = {
  theme: "dark",
  reduceMotion: false,
  largeText: false,
  highContrast: false,
  enhancedFocus: true,
};
const Context = createContext<{
  appearance: Appearance;
  set: (updates: Partial<Appearance>) => void;
  dark: boolean;
  reducedMotion: boolean;
  reset: () => void;
}>(null!);
export function AppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [appearance, setAppearance] = useState(defaults);
  const [systemMotion, setSystemMotion] = useState(false);
  const system = useColorScheme();
  useEffect(() => {
    void AsyncStorage.getItem("fitswap.mobile.appearance").then((s) => {
      if (s) {
        try {
          setAppearance({ ...defaults, ...JSON.parse(s) });
        } catch {}
      }
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(setSystemMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setSystemMotion,
    );
    return () => sub.remove();
  }, []);
  const set = (updates: Partial<Appearance>) =>
    setAppearance((current) => {
      const next = { ...current, ...updates };
      void AsyncStorage.setItem(
        "fitswap.mobile.appearance",
        JSON.stringify(next),
      );
      return next;
    });
  useEffect(() => {
    rem.set(appearance.largeText ? 18 : 16);
  }, [appearance.largeText]);
  const dark =
    appearance.theme === "system"
      ? system !== "light"
      : appearance.theme === "dark";
  return (
    <Context.Provider
      value={{
        appearance,
        set,
        dark,
        reducedMotion: appearance.reduceMotion || systemMotion,
        reset: () => set(defaults),
      }}
    >
      <View
        style={[
          { flex: 1 },
          vars({
            "--canvas": dark ? "10 11 16" : "245 246 251",
            "--panel": dark ? "20 22 31" : "255 255 255",
            "--line": dark
              ? appearance.highContrast
                ? "120 120 140"
                : "43 45 59"
              : appearance.highContrast
                ? "65 65 80"
                : "214 217 229",
            "--fg": dark ? "255 255 255" : "24 24 35",
            "--muted": dark ? "153 158 179" : "88 88 108",
            "--subtle": dark ? "212 212 216" : "63 63 78",
            "--accent": dark ? "191 169 255" : "109 40 217",
            "--success": dark ? "110 231 183" : "4 120 87",
            "--warning": dark ? "252 211 77" : "146 64 14",
            "--danger": dark ? "252 165 165" : "185 28 28",
          }),
        ]}
      >
        {children}
      </View>
    </Context.Provider>
  );
}
export const useAppearance = () => useContext(Context);

export function useThemeVariables() {
  const { dark, appearance } = useAppearance();
  return vars({
    "--canvas": dark ? "10 11 16" : "245 246 251",
    "--panel": dark ? "20 22 31" : "255 255 255",
    "--line": dark
      ? appearance.highContrast
        ? "120 120 140"
        : "43 45 59"
      : appearance.highContrast
        ? "65 65 80"
        : "214 217 229",
    "--fg": dark ? "255 255 255" : "24 24 35",
    "--muted": dark ? "153 158 179" : "88 88 108",
    "--subtle": dark ? "212 212 216" : "63 63 78",
    "--accent": dark ? "191 169 255" : "109 40 217",
    "--success": dark ? "110 231 183" : "4 120 87",
    "--warning": dark ? "252 211 77" : "146 64 14",
    "--danger": dark ? "252 165 165" : "185 28 28",
  });
}
