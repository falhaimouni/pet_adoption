import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface InputFieldProps {
  label: string;
  placeholder: string;
  type?: "text" | "email" | "password";
  icon?: React.ReactNode;
  value?: string;
  onChange?: (val: string) => void;
}

export default function InputField({
  label,
  placeholder,
  type = "text",
  icon,
  value = "",
  onChange,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="relative w-full">
      {/* Floating label */}
      <span className="absolute -top-[9px] left-3 bg-white px-1 text-[12px] font-['Inter',sans-serif] text-[#5e6368] z-10">
        {label}
      </span>

      <div className="relative flex items-center bg-white rounded-[10px] shadow-[0px_1px_2px_rgba(0,0,0,0.25)] border border-[#6b737a] h-[48px] px-3 gap-2">
        {/* Left icon */}
        {icon && <span className="shrink-0 text-[#5e6368]">{icon}</span>}

        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 bg-transparent outline-none font-['Inter',sans-serif] text-[16px] text-[#384048] placeholder:text-[#384048]"
        />

        {/* Password toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            aria-label={showPassword ? t("password_hide") : t("password_show")}
            className="shrink-0 text-[#5e6368] hover:text-[#384048] transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
