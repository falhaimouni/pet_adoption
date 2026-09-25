import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number | "up" | "down";
  trendLabel?: string;
  trendValue?: string;
  accent?: string;
}

export default function KpiCard({ label, value, icon, trend, trendLabel, trendValue, accent = "bg-[rgba(8,157,151,0.12)]" }: KpiCardProps) {
  const isUp = trend === "up" || (typeof trend === "number" && trend >= 0);
  const showTrend = trend !== undefined;

  return (
    <div className="bg-white rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.12)] p-4 sm:p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <div className={`w-[42px] h-[42px] ${accent} rounded-[10px] flex items-center justify-center text-primary`}>
          {icon}
        </div>
        {showTrend && (
          <div className={`flex items-center gap-1 text-[12px] font-['Poppins',sans-serif] ${isUp ? "text-green-600" : "text-red-500"}`}>
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {typeof trend === "number" ? `${Math.abs(trend)}%` : ""}
          </div>
        )}
      </div>
      <div>
        <p className="font-['Poppins',sans-serif] font-semibold text-[24px] sm:text-[28px] text-black leading-none break-words">{value}</p>
        <p className="font-['Poppins',sans-serif] font-light text-[13px] text-black/70 mt-1">{label}</p>
        {(trendLabel || trendValue) && (
          <p className="font-['Poppins',sans-serif] text-[11px] text-primary mt-0.5">{trendValue ?? trendLabel}</p>
        )}
      </div>
    </div>
  );
}
