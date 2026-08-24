import { useState } from "react";
import { Search, Circle } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import profileImg from "../../imports/MyPetopia/0ade9078bed97f834442fbb8c3bc4424aaf43269.png";

interface StaffConversation {
  id: number; adopter: string; petContext: string; lastMessage: string; time: string; unread: number; online: boolean; priority: "normal" | "high"; status: "open" | "waiting" | "archived";
}

const CONVS: StaffConversation[] = [
  { id: 1, adopter: "Roaa A.", petContext: "Max - Golden Retriever", lastMessage: "Your application has been reviewed!", time: "10:32 AM", unread: 0, online: true, priority: "high", status: "open" },
  { id: 2, adopter: "Ali M.", petContext: "Luna - Persian Cat", lastMessage: "Do you have more photos of Luna?", time: "Yesterday", unread: 2, online: false, priority: "normal", status: "waiting" },
  { id: 3, adopter: "Lara B.", petContext: "Poodle - Daisy", lastMessage: "When can I schedule a visit?", time: "Mon", unread: 1, online: true, priority: "normal", status: "open" },
  { id: 4, adopter: "Omar H.", petContext: "Chartreux - Shadow", lastMessage: "Thank you!", time: "Jun 30", unread: 0, online: false, priority: "normal", status: "archived" },
];

interface StaffChatsListPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export default function StaffChatsListPage({ onNavigate }: StaffChatsListPageProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"open" | "waiting" | "archived">("open");

  const filtered = CONVS.filter((c) => {
    const ms = c.adopter.toLowerCase().includes(search.toLowerCase());
    return ms && c.status === tab;
  });

  return (
    <DashboardLayout role="staff" activePage="staff-chats" onNavigate={onNavigate} pageTitle="Staff Inbox" breadcrumbs={["Staff", "Chats"]}>
      <div className="max-w-2xl bg-white rounded-[15px] shadow-md overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-[rgba(8,157,151,0.06)] rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:ring-1 focus:ring-[#089D97] transition-all" />
          </div>
          {/* Tabs */}
          <div className="flex gap-2">
            {(["open", "waiting", "archived"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${tab === t ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>
                {t}
                {t === "waiting" && <span className="ml-1 bg-yellow-400 text-white text-[9px] px-1 rounded-full">2</span>}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <p className="p-8 text-center font-['Poppins',sans-serif] text-[14px] text-black/40">No {tab} conversations.</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => onNavigate("staff-chat-detail", { conversationId: c.id })}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-[rgba(8,157,151,0.04)] transition-colors text-left"
            >
              <div className="relative shrink-0">
                <div className="w-[44px] h-[44px] bg-[rgba(217,217,217,0.82)] rounded-full overflow-hidden">
                  <img src={profileImg} alt="" className="w-full h-full object-contain" />
                </div>
                <Circle size={10} className={`absolute bottom-0 right-0 rounded-full ${c.online ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-['Poppins',sans-serif] text-[13px] truncate ${c.unread > 0 ? "font-semibold text-black" : "font-medium text-black/80"}`}>{c.adopter}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    {c.priority === "high" && <Badge label="High" variant="rejected" size="sm" />}
                    <span className="font-['Poppins',sans-serif] text-[11px] text-black/40">{c.time}</span>
                  </div>
                </div>
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#089D97] truncate">{c.petContext}</p>
                <p className={`font-['Poppins',sans-serif] text-[12px] truncate mt-0.5 ${c.unread > 0 ? "text-black/70 font-medium" : "text-black/40"}`}>{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="shrink-0 w-5 h-5 bg-[#089D97] text-white text-[10px] font-bold rounded-full flex items-center justify-center">{c.unread}</span>
              )}
            </button>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
