import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface BackHomeButtonProps {
  onNavigate: (page: string, params?: Record<string, unknown>) => void;
  className?: string;
}

export default function BackHomeButton({ onNavigate, className = "" }: BackHomeButtonProps) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => onNavigate("home")}
      aria-label={t("back_home")}
      title={t("back_home")}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[#047975] transition-colors hover:bg-[#e0f2f0] hover:text-[#089D97] ${className}`}
    >
      <ArrowLeft size={20} />
    </button>
  );
}
