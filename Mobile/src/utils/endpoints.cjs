function hostname(value) {
  if (!value) return undefined;
  try {
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `http://${value}`,
    );
    return url.hostname || undefined;
  } catch {
    return undefined;
  }
}
function isLoopback(host) {
  return (
    host === "localhost" ||
    host === "[::1]" ||
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host || "")
  );
}
function isLocalHost(host) {
  if (!host) return false;
  if (
    isLoopback(host) ||
    host.endsWith(".local") ||
    /^\[f[cd][0-9a-f:]+\]$/i.test(host)
  )
    return true;
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  const octets = host.split(".").map(Number);
  if (octets.some((n) => n > 255)) return false;
  return (
    octets[0] === 10 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
  );
}
function resolveServiceUrls({
  platform,
  development = false,
  expoHostUri,
  browserOrigin,
  apiUrl,
  webUrl,
}) {
  const browserHost = platform === "web" ? hostname(browserOrigin) : undefined;
  let expoHost =
    platform !== "web" && development ? hostname(expoHostUri) : undefined;
  if (platform === "android" && isLoopback(expoHost)) expoHost = undefined;
  // Infer only local development servers. Deployed services use explicit URLs.
  const host = isLocalHost(browserHost)
    ? browserHost
    : isLocalHost(expoHost)
      ? expoHost
      : platform === "android"
        ? "10.0.2.2"
        : "localhost";
  return {
    apiUrl: (apiUrl?.trim() || `http://${host}:8000/api`).replace(/\/+$/, ""),
    webUrl: (webUrl?.trim() || `http://${host}:5173`).replace(/\/+$/, ""),
  };
}
module.exports = { resolveServiceUrls, isLocalHost };
