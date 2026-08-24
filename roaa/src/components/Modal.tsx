import { X } from "lucide-react";

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
  confirmLabel = "Confirm",
  confirmDestructive = false,
  children,
  size = "md",
}: ModalProps) {
  if (!open) return null;

  const maxW = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative bg-white rounded-[20px] shadow-2xl w-full ${maxW} z-10`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {onConfirm && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-[12px] border border-gray-300 font-['Poppins',sans-serif] font-medium text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2 rounded-[12px] font-['Poppins',sans-serif] font-medium text-[14px] text-white transition-colors ${
                confirmDestructive
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-[#089D97] hover:bg-[#047975]"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
