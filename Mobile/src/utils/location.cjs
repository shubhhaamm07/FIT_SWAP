function distanceKm(first, second) {
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(second.latitude - first.latitude) / 2) ** 2 +
    Math.cos(rad(first.latitude)) *
      Math.cos(rad(second.latitude)) *
      Math.sin(rad(second.longitude - first.longitude) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function coordinates(gym) {
  if (
    gym.latitude == null ||
    gym.longitude == null ||
    gym.latitude === "" ||
    gym.longitude === ""
  )
    return null;
  const latitude = Number(gym.latitude);
  const longitude = Number(gym.longitude);
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}
module.exports = { distanceKm, coordinates };
