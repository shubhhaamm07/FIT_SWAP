import { useContext } from "react";

import { AppearanceContext } from "../context/contexts";

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error("useAppearance must be used inside AppearanceProvider.");
  }

  return context;
}
