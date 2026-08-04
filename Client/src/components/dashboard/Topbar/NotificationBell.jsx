import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "../../../api/notification.api";

function NotificationBell() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    getNotifications().then((items) => { if (active) setCount(items.filter((item) => !item.isRead).length); }).catch(() => {});
    return () => { active = false; };
  }, []);

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
          {count}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
