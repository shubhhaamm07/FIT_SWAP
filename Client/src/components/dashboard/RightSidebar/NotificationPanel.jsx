import { Bell } from "lucide-react";

import { formatDateTime } from "../../../utils/date";

function NotificationPanel({ notifications = [] }) {
  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead,
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">Notifications</h2>

        <span className="text-xs text-violet-400">
          {unreadNotifications.length} New
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Bell size={34} className="text-zinc-600" />

          <h3 className="mt-4 text-base font-semibold">No Notifications</h3>

          <p className="mt-2 text-center text-sm text-zinc-500">
            You're all caught up.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="
                  rounded-xl
                  border
                  border-white/5
                  bg-[#18181F]
                  p-3
                  transition-all
                  duration-300
                  hover:border-violet-500/30
                "
            >
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-semibold">{notification.title}</h4>

                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-2" />
                )}
              </div>

              <p className="mt-2 text-xs leading-5 text-zinc-400">
                {notification.message}
              </p>

              <p className="mt-3 text-[11px] text-zinc-600">
                {formatDateTime(notification.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
