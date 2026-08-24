import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, ArrowLeft, UserCheck, XCircle, RotateCcw, MoreVertical, Circle } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import profileImg from "../../imports/MyPetopia/0ade9078bed97f834442fbb8c3bc4424aaf43269.png";

interface Message {
  id: number; text: string; fromMe: boolean; time: string; read: boolean;
}

const INIT_MSGS: Message[] = [
  { id: 1, text: "Hi, I'm interested in adopting Max.", fromMe: false, time: "10:00 AM", read: true },
  { id: 2, text: "Hello Roaa! Max is a 2-year-old Golden Retriever. Have you had dogs before?", fromMe: true, time: "10:05 AM", read: true },
  { id: 3, text: "Yes, we had a Labrador for 8 years. We have a large yard.", fromMe: false, time: "10:08 AM", read: true },
  { id: 4, text: "That sounds great! I'll process your application right away.", fromMe: true, time: "10:12 AM", read: true },
  { id: 5, text: "Your application has been reviewed! 🎉", fromMe: true, time: "10:32 AM", read: true },
];

interface StaffChatDetailPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  params?: { conversationId?: number };
}

export default function StaffChatDetailPage({ onNavigate }: StaffChatDetailPageProps) {
  const [messages, setMessages] = useState<Message[]>(INIT_MSGS);
  const [input, setInput] = useState("");
  const [convStatus, setConvStatus] = useState<"open" | "closed">("open");
  const [assignOpen, setAssignOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), text: input.trim(), fromMe: true, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), read: false }]);
    setInput("");
  };

  return (
    <DashboardLayout role="staff" activePage="staff-chats" onNavigate={onNavigate}>
      <div className="max-w-3xl flex gap-4">
        {/* Chat panel */}
        <div className="flex-1 flex flex-col bg-white rounded-[15px] shadow-md overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <button onClick={() => onNavigate("staff-chats")} className="text-[#089D97] hover:text-[#047975] transition-colors"><ArrowLeft size={20} /></button>
            <div className="relative">
              <div className="w-[38px] h-[38px] bg-[rgba(217,217,217,0.82)] rounded-full overflow-hidden">
                <img src={profileImg} alt="" className="w-full h-full object-contain" />
              </div>
              <Circle size={10} className="absolute bottom-0 right-0 fill-green-500 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">Roaa A.</p>
              <div className="flex items-center gap-2">
                <p className="font-['Poppins',sans-serif] text-[11px] text-[#089D97]">Max - Golden Retriever</p>
                <Badge label={convStatus} variant={statusBadge(convStatus)} size="sm" />
              </div>
            </div>
            {/* Staff actions */}
            <div className="flex gap-2">
              <button onClick={() => setAssignOpen(true)} title="Assign" className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[rgba(8,157,151,0.1)] text-[#089D97] transition-colors"><UserCheck size={16} /></button>
              {convStatus === "open" ? (
                <button onClick={() => setCloseOpen(true)} title="Close" className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-red-50 text-red-400 transition-colors"><XCircle size={16} /></button>
              ) : (
                <button onClick={() => setConvStatus("open")} title="Reopen" className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-green-50 text-green-500 transition-colors"><RotateCcw size={16} /></button>
              )}
              <button onClick={() => setInfoOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-gray-100 text-black/40 transition-colors"><MoreVertical size={16} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[rgba(186,216,211,0.1)]">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                {!m.fromMe && (
                  <div className="w-[28px] h-[28px] bg-[rgba(217,217,217,0.82)] rounded-full overflow-hidden mr-2 mt-1 shrink-0">
                    <img src={profileImg} alt="" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className={`max-w-[70%] rounded-[16px] px-4 py-2.5 ${m.fromMe ? "bg-[#089D97] text-white rounded-tr-[4px]" : "bg-white text-black shadow-sm rounded-tl-[4px]"}`}>
                  <p className="font-['Poppins',sans-serif] text-[13px] leading-relaxed">{m.text}</p>
                  <div className={`flex items-center justify-end gap-1 mt-1 ${m.fromMe ? "text-white/70" : "text-black/40"}`}>
                    <span className="font-['Poppins',sans-serif] text-[10px]">{m.time}</span>
                    {m.fromMe && <span className="text-[10px]">{m.read ? "✓✓" : "✓"}</span>}
                  </div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className={`px-4 py-3 border-t border-gray-100 bg-white ${convStatus === "closed" ? "opacity-60 pointer-events-none" : ""}`}>
            {convStatus === "closed" && <p className="text-center font-['Poppins',sans-serif] text-[12px] text-black/50 mb-2">Conversation is closed</p>}
            <div className="flex items-center gap-2">
              <button className="text-[#089D97] shrink-0"><Paperclip size={18} /></button>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..." className="flex-1 bg-[rgba(8,157,151,0.06)] rounded-[20px] px-4 py-2.5 font-['Poppins',sans-serif] text-[13px] outline-none focus:ring-1 focus:ring-[#089D97] transition-all" />
              <button onClick={send} disabled={!input.trim()} className="w-[38px] h-[38px] bg-[#089D97] disabled:opacity-40 rounded-full flex items-center justify-center text-white hover:bg-[#047975] transition-colors shrink-0"><Send size={16} /></button>
            </div>
          </div>
        </div>

        {/* Adopter info panel */}
        <div className="hidden lg:flex flex-col gap-3 w-[220px]">
          <div className="bg-white rounded-[15px] shadow-md p-4">
            <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black mb-3">Adopter Profile</p>
            <div className="flex flex-col items-center mb-3">
              <div className="w-[52px] h-[52px] bg-[rgba(217,217,217,0.82)] rounded-full overflow-hidden mb-2">
                <img src={profileImg} alt="" className="w-full h-full object-contain" />
              </div>
              <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black">Roaa A.</p>
              <p className="font-['Poppins',sans-serif] text-[11px] text-[#089D97]">Adopter</p>
            </div>
            {[["Email", "roaa@example.com"], ["Phone", "+962 799 281"], ["City", "Amman"], ["Requests", "3"], ["Adoptions", "1"]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="font-['Poppins',sans-serif] text-[11px] text-black/50">{k}</span>
                <span className="font-['Poppins',sans-serif] text-[11px] text-black font-medium">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal title="Assign Conversation" open={assignOpen} onClose={() => setAssignOpen(false)} onConfirm={() => setAssignOpen(false)} confirmLabel="Assign" size="sm">
        <div>
          <label className="block font-['Poppins',sans-serif] text-[13px] text-black/60 mb-2">Assign to staff member</label>
          <select className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97]">
            <option>Sara (You)</option>
            <option>Ahmed</option>
            <option>Hana</option>
          </select>
        </div>
      </Modal>

      <Modal title="Close Conversation" open={closeOpen} onClose={() => setCloseOpen(false)} onConfirm={() => { setConvStatus("closed"); setCloseOpen(false); }} confirmLabel="Close Conversation" confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">This will mark the conversation as closed. You can reopen it later.</p>
      </Modal>
    </DashboardLayout>
  );
}
