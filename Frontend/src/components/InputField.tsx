import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface InputFieldProps {
  label: string;
  placeholder: string;
  type?: "text" | "email" | "password";
  icon?: React.ReactNode;
  value?: string;
  onChange?: (val: string) => void;
  responsive?: boolean;
  maxLength?: number;
  required?: boolean;
}

export default function InputField({
  label,
  placeholder,
  type = "text",
  icon,
  value = "",
  onChange,
  responsive = false,
  maxLength,
  required = true,
}: InputFieldProps) {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;
  const responsiveClasses = responsive
    ? "xl:h-[clamp(48px,3vw,90px)] xl:px-[clamp(12px,1vw,28px)] xl:gap-[clamp(8px,0.7vw,20px)] xl:[&_svg]:size-[clamp(18px,1.1vw,30px)]"
    : "";

  return (
    <div className="relative w-full">
      {/* Floating label */}
      <label htmlFor={id} className="absolute -top-[9px] left-3 bg-white px-1 text-[12px] font-['Inter',sans-serif] text-[#5e6368] z-10">
        {label}
      </label>

      <div className={`relative flex items-center bg-white rounded-[10px] shadow-[0px_1px_2px_rgba(0,0,0,0.25)] border border-[#6b737a] h-[48px] px-3 gap-2 ${responsiveClasses}`}>
        {/* Left icon */}
        {icon && <span className="shrink-0 text-[#5e6368]">{icon}</span>}

        <input
          id={id}
          required={required}
          maxLength={maxLength ?? (type === "email" ? 254 : type === "password" ? 255 : 161)}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`flex-1 min-w-0 bg-transparent outline-none font-['Inter',sans-serif] text-[16px] text-[#384048] placeholder:text-[#384048] ${responsive ? "xl:text-[clamp(16px,1vw,28px)]" : ""}`}
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
