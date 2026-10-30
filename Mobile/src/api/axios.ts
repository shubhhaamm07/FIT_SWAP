import * as Crypto from "expo-crypto";
import { API_URL, request } from "./client";
export const apiBaseUrl = API_URL;
export type Config = {
  params?: Record<string, unknown>;
  headers?: Record<string, string | undefined>;
  signal?: AbortSignal;
  timeout?: number;
  responseType?: "blob";
  data?: unknown;
  skipAuthLogout?: boolean;
};
export const createIdempotencyConfig = (scope: string, key?: string) => ({
  headers: { "Idempotency-Key": key || `${scope}:${Crypto.randomUUID()}` },
});
function query(path: string, params?: Record<string, unknown>) {
  const values = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      values.set(key, String(value));
  });
  return (
    path + (values.size ? `${path.includes("?") ? "&" : "?"}${values}` : "")
  );
}
async function send(
  method: string,
  url: string,
  data?: unknown,
  config: Config = {},
) {
  return {
    data: await request<any>(query(url, config.params), {
      method,
      body: data,
      signal: config.signal,
      key: config.headers?.["Idempotency-Key"],
      responseType: config.responseType,
      timeout: config.timeout,
    }),
  };
}
const axios = Object.assign(
  (config: Config & { method: string; url: string; data?: unknown }) =>
    send(config.method, config.url, config.data, config),
  {
    get: (url: string, config?: Config) => send("GET", url, undefined, config),
    post: (url: string, data?: unknown, config?: Config) =>
      send("POST", url, data, config),
    patch: (url: string, data?: unknown, config?: Config) =>
      send("PATCH", url, data, config),
    delete: (url: string, config?: Config) =>
      send("DELETE", url, config?.data, config),
  },
);
export default axios;
