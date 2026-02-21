import { create } from "zustand";

export type AppNotificationStatus = "info" | "success" | "error";

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  status: AppNotificationStatus;
}

interface PushNotificationInput {
  title: string;
  message?: string;
  status?: AppNotificationStatus;
  durationMs?: number;
}

interface NotificationState {
  notifications: AppNotification[];
  pushNotification: (input: PushNotificationInput) => string;
  dismissNotification: (id: string) => void;
}

const DEFAULT_DURATION_MS = 3800;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  pushNotification: ({ title, message, status = "info", durationMs }) => {
    const id = `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    set((state) => ({
      notifications: [...state.notifications, { id, title, message, status }],
    }));

    const timeout = durationMs ?? DEFAULT_DURATION_MS;
    if (timeout > 0) {
      setTimeout(() => {
        get().dismissNotification(id);
      }, timeout);
    }

    return id;
  },

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    })),
}));
