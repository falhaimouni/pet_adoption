import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { SOCKET_EVENTS } from "@shared/events/socket.events";
import { localizeNotification } from "../i18n/notifications";
import { useText } from "../i18n/useText";
import { API_BASE_URL, getAccessToken } from "../lib/api";
import { MOCK_API_ENABLED } from "../lib/mockApi";

export function useNotificationSocket(userId?: string) {
  const tx = useText();
  useEffect(() => {
    if (!userId || MOCK_API_ENABLED) return;
    const socket = io(/^https?:\/\//i.test(API_BASE_URL) ? API_BASE_URL : window.location.origin, {
      auth: (callback) => callback({ token: getAccessToken() }),
    });
    socket.on("chatInboxChanged", () => window.dispatchEvent(new Event("petopia:chat-inbox-changed")));
    socket.on("connect", () => {
      window.dispatchEvent(new Event("petopia:notifications-changed"));
      window.dispatchEvent(new Event("petopia:realtime-connected"));
    });
    for (const event of [SOCKET_EVENTS.DIRECT_MESSAGE, SOCKET_EVENTS.DIRECT_MESSAGES_READ, SOCKET_EVENTS.FRIEND_PRESENCE]) {
      socket.on(event, (detail: unknown) => window.dispatchEvent(new CustomEvent(`petopia:${event}`, { detail })));
    }
    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, (notification: { title: string; type: string; message: string }) => {
      window.dispatchEvent(new Event("petopia:notifications-changed"));
      toast(localizeNotification(notification.title, tx), {
        description: localizeNotification(notification.message, tx),
      });
    });
    return () => { socket.disconnect(); };
  }, [userId, tx]);
}
