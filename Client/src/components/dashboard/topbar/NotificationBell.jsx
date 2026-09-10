import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "../../../api/notification.api";
import { useToast } from "../../../hooks/useToast";
import { apiBaseUrl } from "../../../api/axios";
import { isRequestCancelled, useVisibilityPolling } from "../../../hooks/useVisibilityPolling";

const notificationStreamUrl = `${apiBaseUrl.replace(/\/$/, "")}/notifications/stream`;

function NotificationBell() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [count, setCount] = useState(0);

  const refreshUnreadCount = useCallback(async ({ signal } = {}) => {
    try {
      const items = await getNotifications({ signal });
      if (!signal?.aborted) setCount(items.filter((item) => !item.isRead).length);
    } catch (error) {
      if (!isRequestCancelled(error)) throw error;
    }
  }, []);

  // This is a fallback for reconnects and deployments. It is paused while the
  // page is hidden and automatically slows down when the API is unavailable.
  useVisibilityPolling(refreshUnreadCount, { interval: 60_000 });

  useEffect(() => {
    let active = true;
    let stream = null;
    let reconnectTimer = null;
    let attempts = 0;

    const onNotification = (event) => {
      try {
        const notification = JSON.parse(event.data);
        if (!active || !notification?.id) return;
        setCount((current) => current + (notification.isRead ? 0 : 1));
        showToast(`${notification.title}: ${notification.message}`);
        window.dispatchEvent(new CustomEvent("fitswap:notification", { detail: notification }));
      } catch {
        // Ignore an invalid stream payload and wait for the next event.
      }
    };

    const closeStream = () => {
      if (!stream) return;
      stream.removeEventListener("notification", onNotification);
      stream.close();
      stream = null;
    };

    const connect = () => {
      if (!active || document.visibilityState === "hidden") return;
      closeStream();
      stream = new EventSource(notificationStreamUrl, { withCredentials: true });
      stream.addEventListener("notification", onNotification);
      stream.onopen = () => { attempts = 0; };
      stream.onerror = () => {
        closeStream();
        if (!active || document.visibilityState === "hidden") return;
        attempts += 1;
        reconnectTimer = window.setTimeout(connect, Math.min(1_000 * (2 ** attempts), 60_000));
      };
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
        closeStream();
        return;
      }
      attempts = 0;
      void refreshUnreadCount();
      connect();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    connect();

    return () => {
      active = false;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      closeStream();
    };
  }, [refreshUnreadCount, showToast]);

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      aria-label="Open notifications"
      className="
        relative
        w-10
        h-10
        rounded-xl
        bg-[#14141C]
        border
        border-white/10
        flex
        items-center
        justify-center
        hover:border-violet-500
      "
    >
      <Bell size={18} />

      {count > 0 && (
        <span
          className="
            absolute
            -top-1
            -right-1
            w-4
            h-4
            rounded-full
            bg-red-500
            text-[9px]
            flex
            items-center
            justify-center
          "
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
