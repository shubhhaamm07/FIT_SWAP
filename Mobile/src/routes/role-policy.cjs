const members = new Set([
  "Trials",
  "Wellness",
  "Diet",
  "Sell",
  "MyListings",
  "Saved",
]);
function canAccess(role, route) {
  if (route === "Admin") return role === "ADMIN";
  if (route === "Owner" || route === "OwnerGym") return role === "GYM_OWNER";
  if (members.has(route)) return role === "USER";
  if (route === "Plus") return role === "USER" || role === "GYM_OWNER";
  return ["USER", "GYM_OWNER", "ADMIN"].includes(role);
}
module.exports = { canAccess };
