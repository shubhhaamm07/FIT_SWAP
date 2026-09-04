import { useContext } from "react";

import { AppearanceContext } from "../context/appearance-context";

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used inside AppearanceProvider.");
  }

  return context;
}

