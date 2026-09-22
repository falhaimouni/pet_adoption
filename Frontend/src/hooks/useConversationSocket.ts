import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_EVENTS } from "@shared/events/socket.events";
import { API_BASE_URL, getAccessToken } from "../lib/api";
import { MOCK_API_ENABLED } from "../lib/mockApi";

export type RealtimeStatus = "disabled" | "connecting" | "connected" | "disconnected";

interface RealtimeMessage {
  messageId: string;
  senderId: string;
  messageText?: string | null;
  isRead?: boolean;
  createdAt: string;
}

function socketServerUrl() {
  return /^https?:\/\//i.test(API_BASE_URL) ? API_BASE_URL : window.location.origin;
}

export function useConversationSocket(
  conversationId: string | undefined,
  onMessage: (message: RealtimeMessage) => void,
  onOwnership?: (state: { conversationId: string; assignedEmployeeId: string | null }) => void,
) {
  const [status, setStatus] = useState<RealtimeStatus>(
    MOCK_API_ENABLED ? "disabled" : "connecting",
  );

  useEffect(() => {
    if (MOCK_API_ENABLED || !conversationId) {
      setStatus(MOCK_API_ENABLED ? "disabled" : "disconnected");
      return;
    }

    const socket = io(socketServerUrl(), {
      auth: { token: getAccessToken() },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5_000,
    });

    function joinConversation() {
      socket.emit(SOCKET_EVENTS.JOIN_CONVERSATION, conversationId);
    }

    function handleConnect() {
      setStatus("connecting");
      joinConversation();
    }

    function handleJoinedConversation() {
      setStatus("connected");
    }

    function handleJoinError() {
      setStatus("disconnected");
    }

    function handleDisconnect() {
      setStatus("disconnected");
    }

    if (onOwnership) socket.on("conversationOwnership", onOwnership);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleDisconnect);
    socket.on("joinedConversation", handleJoinedConversation);
    socket.on("joinedConversationError", handleJoinError);
    socket.on(SOCKET_EVENTS.RECEIVE_MESSAGE, onMessage);
    socket.io.on("reconnect_attempt", () => {
      socket.auth = { token: getAccessToken() };
      setStatus("connecting");
    });

    return () => {
      if (socket.connected) socket.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, conversationId);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleDisconnect);
      socket.off("joinedConversation", handleJoinedConversation);
      socket.off("joinedConversationError", handleJoinError);
      socket.off(SOCKET_EVENTS.RECEIVE_MESSAGE, onMessage);
      if (onOwnership) socket.off("conversationOwnership", onOwnership);
      socket.disconnect();
    };
  }, [conversationId, onMessage, onOwnership]);

  return status;
}
