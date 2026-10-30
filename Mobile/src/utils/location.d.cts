export function distanceKm(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
): number;
export function coordinates(
  gym: Record<string, any>,
): { latitude: number; longitude: number } | null;
