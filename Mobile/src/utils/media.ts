import { API_URL, getSessionToken } from "../api/client";
export function mediaSource(uri: string) {
  const url = uri.startsWith("/") ? new URL(uri, API_URL).toString() : uri;
  const sameOrigin = new URL(url).origin === new URL(API_URL).origin;
  return {
    uri: url,
    ...(sameOrigin && getSessionToken()
      ? { headers: { Authorization: `Bearer ${getSessionToken()}` } }
      : {}),
  };
}
