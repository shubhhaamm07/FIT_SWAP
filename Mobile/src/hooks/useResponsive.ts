import { useWindowDimensions } from "react-native";
import { resolveLayout } from "../utils/responsive.cjs";
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  return resolveLayout(width, height, fontScale);
}
