import * as Location from "expo-location";
import { useState } from "react";
import { useAction } from "./useApi";
export function useDeviceLocation() {
  const [position, setPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const { busy, run } = useAction();
  const locate = () =>
    run(async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted")
        throw new Error(
          "Location permission was not granted. You can search by city instead.",
        );
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setPosition(result.coords);
    });
  return { position, busy, locate, clear: () => setPosition(null) };
}
