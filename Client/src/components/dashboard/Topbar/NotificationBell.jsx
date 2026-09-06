import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "../../../api/notification.api";
import { useToast } from "../../../hooks/useToast";

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || "/api";
const notificationStreamUrl = `${apiBaseUrl.replace(/\/$/, "")}/notifications/stream`;

function NotificationBell() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refreshUnreadCount = () => getNotifications()
      .then((items) => { if (active) setCount(items.filter((item) => !item.isRead).length); })
      .catch(() => {});
    void refreshUnreadCount();

    // SSE gives active users immediate alerts. A periodic refresh remains as a
    // graceful fallback if a proxy closes the stream or the API later scales.
    const stream = new EventSource(notificationStreamUrl, { withCredentials: true });
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
    stream.addEventListener("notification", onNotification);
    const poll = window.setInterval(() => { void refreshUnreadCount(); }, 45000);

    return () => {
      active = false;
      window.clearInterval(poll);
      stream.removeEventListener("notification", onNotification);
      stream.close();
    };
  }, [showToast]);

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
