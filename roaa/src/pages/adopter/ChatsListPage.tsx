import { useState } from "react";
import { Search, MessageCircle, Circle } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import EmptyState from "../../components/EmptyState";
import profileImg from "../../imports/MyPetopia/0ade9078bed97f834442fbb8c3bc4424aaf43269.png";

export interface Conversation {
  id: number;
  withName: string;
  withRole: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  petContext?: string;
}

export const CONVERSATIONS: Conversation[] = [
  { id: 1, withName: "Shelter Staff - Sara", withRole: "Staff", lastMessage: "Your application for Max has been reviewed!", time: "10:32 AM", unread: 2, online: true, petContext: "Max - Golden Retriever" },
  { id: 2, withName: "Dr. Khalil", withRole: "Veterinarian", lastMessage: "Luna had her checkup. All clear!", time: "Yesterday", unread: 0, online: false, petContext: "Luna - Persian Cat" },
  { id: 3, withName: "Shelter Staff - Ahmed", withRole: "Staff", lastMessage: "We need one more document from you.", time: "Mon", unread: 1, online: true, petContext: "Rabbit - Lola" },
  { id: 4, withName: "Support Team", withRole: "Staff", lastMessage: "Thanks for contacting Petopia!", time: "Jun 28", unread: 0, online: false },
];

interface ChatsListPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export default function ChatsListPage({ onNavigate }: ChatsListPageProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = CONVERSATIONS.filter((c) => {
    const matchSearch = c.withName.toLowerCase().includes(search.toLowerCase()) || (c.petContext ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "unread" && c.unread > 0);
    return matchSearch && matchFilter;
  });

  return (
    <DashboardLayout role="adopter" activePage="chats" onNavigate={onNavigate} pageTitle="Messages" breadcrumbs={["My Petopia", "Chats"]}>
      <div className="max-w-2xl">
        <div className="bg-white rounded-[15px] shadow-md overflow-hidden">
          {/* Search + filter */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
              <input
                placeholder={t("chats_search_ph")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[rgba(8,157,151,0.06)] border border-transparent rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "unread"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${filter === f ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>
                  {f === "all" ? t("chats_all") : t("chats_unread")}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation list */}
          {filtered.length === 0 ? (
            <EmptyState icon={<MessageCircle size={28} />} title={t("chats_no_conv")} description={t("chats_no_conv_desc")} />
          ) : (
            <div>
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onNavigate("chat-detail", { conversationId: c.id })}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-[rgba(8,157,151,0.04)] transition-colors text-left"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-[46px] h-[46px] bg-[rgba(217,217,217,0.82)] rounded-full overflow-hidden">
                      <img src={profileImg} alt="" className="w-full h-full object-contain" />
                    </div>
                    <Circle
                      size={11}
                      className={`absolute bottom-0 right-0 rounded-full ${c.online ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-['Poppins',sans-serif] text-[14px] truncate ${c.unread > 0 ? "font-semibold text-black" : "font-medium text-black/80"}`}>{c.withName}</p>
                      <span className="font-['Poppins',sans-serif] text-[11px] text-black/40 shrink-0 ml-2">{c.time}</span>
                    </div>
                    {c.petContext && (
                      <p className="font-['Poppins',sans-serif] text-[11px] text-[#089D97] truncate">{c.petContext}</p>
                    )}
                    <p className={`font-['Poppins',sans-serif] text-[12px] truncate mt-0.5 ${c.unread > 0 ? "text-black/70 font-medium" : "text-black/40"}`}>{c.lastMessage}</p>
                  </div>

                  {/* Unread badge */}
                  {c.unread > 0 && (
                    <span className="shrink-0 w-5 h-5 bg-[#089D97] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
