export function safeReturnPath(value) {
  // Only resume browsing and member actions; never accept an external redirect.
  return typeof value === "string" && /^\/(marketplace|gyms|trials|memberships|transfers|dashboard|profile|settings|notifications|support|diet-planner|wellness|security|plus)(\/|\?|$)/.test(value)
    && !/[\\\r\n]/.test(value) ? value : "";
}

export const signInPath = (path) => `/login?returnTo=${encodeURIComponent(safeReturnPath(path) || "/marketplace")}`;
