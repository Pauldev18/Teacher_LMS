import { createContext, useContext, useEffect, useState } from "react";
import useNotificationSocket from "../services/notificationService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { currentUserLMS } = useAuth();
  const userId = currentUserLMS?.id;
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotification, setLastNotification] = useState(null);

  // socket luôn chạy ở đây
  useNotificationSocket({
    userId,
    onMessage: (notif) => {
      // tuỳ BE trả về gì, bạn có thể tăng counter hoặc lưu noti
      setUnreadCount((c) => c + 1);
      setLastNotification(notif);
      // Có thể hiển thị toast
      if (notif?.title) {
        window.dispatchEvent(
          new CustomEvent("app:newNotification", { detail: notif })
        );
      }
    },
  });

  return (
    <NotificationContext.Provider
      value={{ unreadCount, setUnreadCount, lastNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
