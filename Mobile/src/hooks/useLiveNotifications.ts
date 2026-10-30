import { fetch as expoFetch } from "expo/fetch";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { API_URL, getSessionToken } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { useFeedback } from "../contexts/FeedbackContext";
import { invalidateResources } from "../utils/resource-events";
export function useLiveNotifications() {
  const { user, demo, forgetSession } = useAuth();
  const { notify } = useFeedback();
  useEffect(() => {
    if (!user || demo) return;
    let disposed = false;
    let controller: AbortController | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    async function connect() {
      if (disposed || AppState.currentState !== "active") return;
      controller?.abort();
      controller = new AbortController();
      try {
        const token = getSessionToken();
        const response = await expoFetch(`${API_URL}/notifications/stream`, {
          signal: controller.signal,
          credentials: Platform.OS === "web" ? "include" : "omit",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.status === 401) {
          await forgetSession();
          return;
        }
        if (!response.ok || !response.body)
          throw new Error("Stream unavailable");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!disposed) {
          const result = await reader.read();
          if (result.done) break;
          buffer += decoder
            .decode(result.value, { stream: true })
            .replace(/\r\n/g, "\n");
          if (buffer.length > 65536) buffer = "";
          let end: number;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            const event = buffer.slice(0, end);
            buffer = buffer.slice(end + 2);
            if (!event.includes("event: notification")) continue;
            try {
              const data = event
                .split("\n")
                .filter((l) => l.startsWith("data:"))
                .map((l) => l.slice(5).trim())
                .join("\n");
              const notification = JSON.parse(data);
              invalidateResources();
              notify(notification.title || "You have a new FitSwap update.");
            } catch {}
          }
        }
      } catch {
      } finally {
        if (!disposed && AppState.currentState === "active")
          retry = setTimeout(connect, 30000);
      }
    }
    void connect();
    const subscription = AppState.addEventListener("change", (state) => {
      clearTimeout(retry);
      if (state === "active") {
        invalidateResources();
        void connect();
      } else controller?.abort();
    });
    return () => {
      disposed = true;
      clearTimeout(retry);
      controller?.abort();
      subscription.remove();
    };
  }, [user?.id, demo]);
}
