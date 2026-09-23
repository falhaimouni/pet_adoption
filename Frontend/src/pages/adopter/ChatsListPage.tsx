import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { apiFetch } from "../../lib/api";
export interface Conversation {
  conversationId: string;
  status: string;
  updatedAt: string;
  assignedEmployee?: { firstName: string; lastName: string } | null;
  lastMessage?: { messageText?: string | null; createdAt: string } | null;
  unreadCount?: number;
}

export default function ChatsListPage({
  onNavigate,
}: {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
}) {
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const navigateRef = useRef(onNavigate);
  navigateRef.current = onNavigate;
  useEffect(() => {
    let active = true;
    setError("");
    apiFetch<Conversation>("/conversations", { method: "POST" })
      .then((conversation) => {
        if (active)
          navigateRef.current("chat-detail", {
            conversationId: conversation.conversationId,
          });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  return (
    <DashboardLayout
      role="adopter"
      activePage="support-chat"
      onNavigate={onNavigate}
      pageTitle="Support Chat"
    >
      {error ? (
        <div role="alert" className="space-y-3">
          <p className="text-red-700">{error}</p>
          <button
            className="rounded-lg bg-teal-600 px-4 py-2 text-white"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <p>Opening Support Chat…</p>
      )}
    </DashboardLayout>
  );
}
