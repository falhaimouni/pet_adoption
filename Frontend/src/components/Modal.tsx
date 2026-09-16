import { X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDestructive?: boolean;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({
  title,
  open,
  onClose,
  onConfirm,
  confirmLabel,
  confirmDestructive = false,
  children,
  size = "md",
}: ModalProps) {
  const { t } = useLanguage();
  if (!open) return null;

  const maxW = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-[18px] sm:rounded-[20px] shadow-2xl w-full ${maxW} max-h-[calc(100dvh-1.5rem)] overflow-hidden z-10 flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] sm:text-[18px] text-black break-words">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-6 py-5 overflow-y-auto">{children}</div>

        {/* Footer */}
        {onConfirm && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-[12px] border border-gray-300 font-['Poppins',sans-serif] font-medium text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t("action_cancel")}
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2 rounded-[12px] font-['Poppins',sans-serif] font-medium text-[14px] text-white transition-colors ${
                confirmDestructive
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#089D97] hover:bg-[#047975]"
              }`}
            >
              {confirmLabel ?? t("action_confirm")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
