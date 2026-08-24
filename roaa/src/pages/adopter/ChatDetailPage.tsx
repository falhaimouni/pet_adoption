import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, ArrowLeft, MoreVertical, Circle } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { CONVERSATIONS } from "./ChatsListPage";
import profileImg from "../../imports/MyPetopia/0ade9078bed97f834442fbb8c3bc4424aaf43269.png";

interface Message {
  id: number;
  text: string;
  fromMe: boolean;
  time: string;
  read: boolean;
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, text: "Hello! I'm interested in adopting Max the Golden Retriever.", fromMe: true, time: "10:00 AM", read: true },
  { id: 2, text: "Hi Roaa! Great to hear that. Max is a wonderful dog. Can you tell me a bit about your home environment?", fromMe: false, time: "10:05 AM", read: true },
  { id: 3, text: "We have a large backyard and two kids aged 7 and 10. We've had dogs before.", fromMe: true, time: "10:08 AM", read: true },
  { id: 4, text: "That sounds perfect for Max! He's very energetic and loves playing with children. I'll forward your details to our adoption coordinator.", fromMe: false, time: "10:15 AM", read: true },
  { id: 5, text: "Your application for Max has been reviewed! 🎉", fromMe: false, time: "10:32 AM", read: false },
];

interface ChatDetailPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  params?: { conversationId?: number };
}

export default function ChatDetailPage({ onNavigate, params }: ChatDetailPageProps) {
  const conv = CONVERSATIONS.find((c) => c.id === (params?.conversationId ?? 1)) ?? CONVERSATIONS[0];
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), text: input.trim(), fromMe: true, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), read: false }]);
    setInput("");
    // Simulate typing reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: "Thanks for your message! We'll get back to you shortly.", fromMe: false, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), read: false }]);
    }, 2000);
  };

  return (
    <DashboardLayout role="adopter" activePage="chats" onNavigate={onNavigate}>
      <div className="max-w-2xl flex flex-col h-[calc(100vh-160px)] bg-white rounded-[15px] shadow-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
          <button onClick={() => onNavigate("chats")} className="text-[#089D97] hover:text-[#047975] transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="relative">
            <div className="w-[40px] h-[40px] bg-[rgba(217,217,217,0.82)] rounded-full overflow-hidden">
              <img src={profileImg} alt="" className="w-full h-full object-contain" />
            </div>
            <Circle size={10} className={`absolute bottom-0 right-0 rounded-full ${conv.online ? "fill-green-500 text-green-500" : "fill-gray-400 text-gray-400"}`} />
          </div>
          <div className="flex-1">
            <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">{conv.withName}</p>
            <p className="font-['Poppins',sans-serif] text-[11px] text-[#089D97]">{conv.online ? "Online" : "Offline"}</p>
          </div>
          {conv.petContext && (
            <span className="hidden sm:inline-flex px-3 py-1 bg-[rgba(8,157,151,0.1)] rounded-full font-['Poppins',sans-serif] text-[11px] text-[#089D97]">
              {conv.petContext}
            </span>
          )}
          <button className="text-black/40 hover:text-black transition-colors"><MoreVertical size={18} /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[rgba(186,216,211,0.15)]">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
              {!m.fromMe && (
                <div className="w-[30px] h-[30px] bg-[rgba(217,217,217,0.82)] rounded-full overflow-hidden mr-2 mt-1 shrink-0">
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

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="w-[30px] h-[30px] bg-[rgba(217,217,217,0.82)] rounded-full overflow-hidden mr-2 mt-1 shrink-0">
                <img src={profileImg} alt="" className="w-full h-full object-contain" />
              </div>
              <div className="bg-white rounded-[16px] rounded-tl-[4px] px-4 py-3 shadow-sm flex gap-1 items-center">
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} className="w-2 h-2 bg-[#089D97] rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <button className="text-[#089D97] hover:text-[#047975] transition-colors shrink-0">
              <Paperclip size={18} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message..."
              className="flex-1 bg-[rgba(8,157,151,0.06)] rounded-[20px] px-4 py-2.5 font-['Poppins',sans-serif] text-[13px] outline-none focus:ring-1 focus:ring-[#089D97] transition-all"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="w-[38px] h-[38px] bg-[#089D97] disabled:opacity-40 rounded-full flex items-center justify-center text-white hover:bg-[#047975] transition-colors shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
