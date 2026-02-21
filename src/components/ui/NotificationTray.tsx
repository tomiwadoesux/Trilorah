import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useNotificationStore } from "../../stores/notificationStore";

export default function NotificationTray() {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismissNotification = useNotificationStore(
    (state) => state.dismissNotification,
  );

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[120] flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => {
        const styles =
          notification.status === "success"
            ? "border-[#3E9B4F]/40 bg-[#0e1a10]/90 text-[#d7f5dc]"
            : notification.status === "error"
              ? "border-red-500/40 bg-[#220f12]/90 text-red-100"
              : "border-blue-500/40 bg-[#0d1627]/90 text-blue-100";

        return (
          <div
            key={notification.id}
            className={`pointer-events-auto min-w-[320px] max-w-[420px] border backdrop-blur rounded-xl shadow-xl ${styles}`}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="pt-0.5">
                {notification.status === "success" ? (
                  <CheckCircle2 size={16} />
                ) : notification.status === "error" ? (
                  <AlertCircle size={16} />
                ) : (
                  <Info size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {notification.title}
                </div>
                {notification.message && (
                  <div className="text-xs opacity-90 mt-0.5 leading-relaxed">
                    {notification.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
