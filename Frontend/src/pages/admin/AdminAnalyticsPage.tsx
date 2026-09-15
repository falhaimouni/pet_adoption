import { useState } from "react";
import { Download, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import KpiCard from "../../components/KpiCard";
import { Users, PawPrint, Heart, MessageSquare } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const userGrowth = [
  { month: "Jan", users: 95, adopters: 80, staff: 10, vets: 3, managers: 1, admins: 1 },
  { month: "Feb", users: 102, adopters: 86, staff: 10, vets: 3, managers: 2, admins: 1 },
  { month: "Mar", users: 110, adopters: 94, staff: 10, vets: 3, managers: 2, admins: 1 },
  { month: "Apr", users: 119, adopters: 102, staff: 11, vets: 3, managers: 2, admins: 1 },
  { month: "May", users: 128, adopters: 110, staff: 11, vets: 3, managers: 2, admins: 1 },
  { month: "Jun", users: 138, adopters: 120, staff: 11, vets: 3, managers: 2, admins: 1 },
  { month: "Jul", users: 134, adopters: 116, staff: 11, vets: 3, managers: 2, admins: 1 },
];

const roleDistribution = [
  { name: "Adopters", value: 120 },
  { name: "Staff", value: 11 },
  { name: "Vets", value: 3 },
  { name: "Managers", value: 2 },
  { name: "Admins", value: 1 },
];

const adoptionTrend = [
  { month: "Jan", adoptions: 8, rejections: 3 },
  { month: "Feb", adoptions: 12, rejections: 4 },
  { month: "Mar", adoptions: 10, rejections: 2 },
  { month: "Apr", adoptions: 15, rejections: 5 },
  { month: "May", adoptions: 18, rejections: 3 },
  { month: "Jun", adoptions: 22, rejections: 4 },
  { month: "Jul", adoptions: 17, rejections: 2 },
];

const storageData = [
  { category: "Images", gb: 4.2 },
  { category: "PDFs", gb: 1.8 },
  { category: "Docs", gb: 0.5 },
  { category: "Other", gb: 0.3 },
];

const COLORS = ["#089D97", "#47BDB8", "#80CECE", "#047975", "#B2E0DF"];

interface AdminAnalyticsPageProps { onNavigate: (page: string) => void; }

export default function AdminAnalyticsPage({ onNavigate }: AdminAnalyticsPageProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState("7m");

  return (
    <DashboardLayout role="admin" activePage="admin-analytics" onNavigate={onNavigate} pageTitle={t("analytics_system")} breadcrumbs={[t("role_admin"), t("nav_analytics")]}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-2">
          {["7m", "3m", "1m"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] transition-colors ${period === p ? "bg-[#089D97] text-white" : "bg-white text-black/70 hover:bg-gray-100"}`}>{p}</button>
          ))}
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-[#089D97] text-[#089D97] font-['Poppins',sans-serif] text-[13px] rounded-[10px] hover:bg-[rgba(8,157,151,0.1)] transition-colors">
          <Download size={15} /> {t("action_export")}
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<Users size={20} />} label={t("admin_total_users")} value="137" trend="up" trendValue={t("analytics_trend_month").replace("{value}", "+12%")} />
        <KpiCard icon={<PawPrint size={20} />} label={t("analytics_pets_listed")} value="64" trend="up" trendValue={t("analytics_trend_week").replace("{value}", "+4")} />
        <KpiCard icon={<Heart size={20} />} label={t("nav_adoptions")} value="102" trend="up" trendValue={t("analytics_trend_month").replace("{value}", "+18")} />
        <KpiCard icon={<MessageSquare size={20} />} label={t("analytics_active_chats")} value="23" trend="up" trendValue={t("analytics_open_count").replace("{count}", "+7")} />
      </div>

      {/* User growth */}
      <div className="bg-white rounded-[15px] shadow-md p-5 mb-5">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">{t("analytics_user_growth")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={userGrowth} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#089D97" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#089D97" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 10 }} />
            <Area type="monotone" dataKey="users" stroke="#089D97" strokeWidth={2.5} fill="url(#userGrad)" />
            <Line type="monotone" dataKey="adopters" stroke="#80CECE" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Role distribution */}
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">{t("admin_role_distribution")}</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {roleDistribution.map((r, i) => (
                <div key={r.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                  <span className="font-['Poppins',sans-serif] text-[12px] text-black/70">{t(`role_${r.name.toLowerCase()}`) === `role_${r.name.toLowerCase()}` ? r.name : t(`role_${r.name.toLowerCase()}`)}</span>
                  <span className="font-['Poppins',sans-serif] text-[12px] font-semibold text-black ml-auto">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Adoption vs rejection */}
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">{t("analytics_adoptions_rejections")}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={adoptionTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 10 }} />
              <Legend wrapperStyle={{ fontFamily: "Poppins", fontSize: 11 }} />
              <Bar dataKey="adoptions" fill="#089D97" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejections" fill="#F87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Storage */}
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{t("analytics_storage_usage")}</h3>
          <p className="font-['Poppins',sans-serif] text-[13px] text-black/50">{t("analytics_storage_used").replace("{used}", "6.8 GB").replace("{total}", "50 GB")}</p>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-[#089D97] rounded-full" style={{ width: "13.6%" }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {storageData.map((s, i) => (
            <div key={s.category} className="text-center">
              <div className="w-8 h-8 rounded-full mx-auto mb-1" style={{ background: COLORS[i] + "33" }}>
                <div className="w-3 h-3 rounded-full mx-auto mt-2.5" style={{ background: COLORS[i] }} />
              </div>
              <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{s.gb} GB</p>
              <p className="font-['Poppins',sans-serif] text-[11px] text-black/50">{t(`storage_${s.category.toLowerCase()}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
