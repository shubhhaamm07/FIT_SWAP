import Constants from "expo-constants";
import { resolveServiceUrls, isLocalHost } from "../utils/endpoints.cjs";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { demoData } from "../utils/demo";

const endpoints = resolveServiceUrls({
  platform: Platform.OS,
  development: typeof __DEV__ !== "undefined" && __DEV__,
  expoHostUri:
    Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost,
  browserOrigin:
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : undefined,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  webUrl: process.env.EXPO_PUBLIC_WEB_URL,
});
export const API_URL = endpoints.apiUrl;
export const WEB_URL = endpoints.webUrl;
let token: string | null = null;
let previewRole: string | null = null;
export function setPreviewRole(role: string | null) {
  previewRole = role;
}
export function getPreviewRole() {
  return previewRole;
}
export function getSessionToken() {
  return token;
}
let expired: (() => void) | undefined;
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
  get response() {
    return {
      status: this.status,
      data: { message: this.message, code: this.code },
    };
  }
}
export function onSessionExpired(callback: () => void) {
  expired = callback;
  return () => {
    expired = undefined;
  };
}
export async function restoreToken() {
  if (Platform.OS !== "web")
    token = await SecureStore.getItemAsync("fitswap.session");
  return !!token;
}
export async function saveToken(next: string | null) {
  if (Platform.OS !== "web") {
    if (next)
      await SecureStore.setItemAsync("fitswap.session", next, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    else await SecureStore.deleteItemAsync("fitswap.session");
  }
  token = next;
}
export async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    key?: string;
    signal?: AbortSignal;
    responseType?: "blob";
    timeout?: number;
  } = {},
): Promise<T> {
  if (previewRole) {
    if (options.responseType === "blob")
      throw new Error(
        "Preview attachments are not available. Sign in to view real files.",
      );
    if (options.method && options.method.toUpperCase() !== "GET")
      throw new Error("Preview is read-only. Sign in to make changes.");
    return demoData(path, previewRole) as T;
  }
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout || 20000,
  );
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort);
  if (options.signal?.aborted) controller.abort();
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      signal: controller.signal,
      credentials: Platform.OS === "web" ? "include" : "omit",
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.key ? { "Idempotency-Key": options.key } : {}),
      },
      ...(options.body !== undefined
        ? {
            body:
              options.body instanceof FormData
                ? options.body
                : JSON.stringify(options.body),
          }
        : {}),
    });
    const data =
      response.status === 204
        ? null
        : options.responseType === "blob" && response.ok
          ? await response.blob()
          : await response.json();
    if (!response.ok) {
      if (
        response.status === 401 &&
        ![
          "/auth/login",
          "/auth/mobile/login",
          "/auth/google",
          "/auth/mobile/google",
        ].some((p) => path === p)
      )
        expired?.();
      throw new ApiError(
        data?.message || "Something went wrong. Please try again.",
        response.status,
        data?.code,
      );
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted)
      throw new Error("The request timed out. Please try again.");
    const local = isLocalHost(new URL(API_URL).hostname);
    throw new Error(
      local && Platform.OS !== "web"
        ? "Cannot connect to FitSwap. Keep your phone and computer on the same Wi-Fi, allow local network access for Expo Go, and check that the server is running."
        : "Cannot reach FitSwap. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
