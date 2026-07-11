import { Bell, CheckCircle } from "lucide-react";

function NotificationPanel({ notifications = [] }) {
  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-[#12121A] p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notifications</h2>

        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/15">
          <Bell size={15} className="text-violet-400" />
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle size={34} className="mx-auto text-zinc-600" />

          <p className="mt-3 text-sm text-zinc-500">You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 transition hover:border-violet-500/20"
            >
              <div className="flex items-start gap-3">
                {!notification.isRead && (
                  <div className="mt-2 h-2 w-2 rounded-full bg-violet-500" />
                )}

                <div className="flex-1">
                  <h4 className="text-sm font-medium">{notification.title}</h4>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-[11px] text-zinc-600">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default NotificationPanel;
