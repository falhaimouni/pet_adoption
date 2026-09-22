import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { SOCKET_EVENTS } from "@shared/events/socket.events";
import { API_BASE_URL, getAccessToken } from "../lib/api";
import { MOCK_API_ENABLED } from "../lib/mockApi";
import { useLanguage } from "../context/LanguageContext";

export function useNotificationSocket(userId?: string) {
  const { t } = useLanguage();
  useEffect(() => {
    if (!userId || MOCK_API_ENABLED) return;
    const socket = io(/^https?:\/\//i.test(API_BASE_URL) ? API_BASE_URL : window.location.origin, {
      auth: (callback) => callback({ token: getAccessToken() }),
    });
    socket.on("chatInboxChanged", () => window.dispatchEvent(new Event("petopia:chat-inbox-changed")));
    socket.on("connect", () => window.dispatchEvent(new Event("petopia:notifications-changed")));
    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, (notification: { title: string; type: string; message: string }) => {
      window.dispatchEvent(new Event("petopia:notifications-changed"));
      if (notification.type === "MESSAGE") {
        const name = notification.message.replace(/^New message from /, "");
        toast(t("chat_new_message"), { description: `${t("chat_message_from")} ${name === "Petopia Support" ? t("chats_support") : name}` });
      } else {
        toast(translateNotification(notification.title, t), {
          description: translateNotification(notification.message, t),
        });
      }
    });
    return () => { socket.disconnect(); };
  }, [userId, t]);
}

function translateNotification(value: string, t: (key: string) => string) {
  const map: Record<string, string> = {
    "New adoption request": "notification_new_adoption_request",
    "Mochi has a new interested adopter.": "notification_new_adoption_request_msg",
    "Low stock": "notification_low_stock",
    "Some store supplies are near the low stock limit.": "notification_low_stock_msg",
  };
  return map[value] ? t(map[value]) : value;
}
