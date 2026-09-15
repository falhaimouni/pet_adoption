import { useState } from "react";
import { Download } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";

const monthlyAdoptions = [
  { month: "Jan", adoptions: 8, requests: 14 },
  { month: "Feb", adoptions: 12, requests: 18 },
  { month: "Mar", adoptions: 10, requests: 15 },
  { month: "Apr", adoptions: 15, requests: 20 },
  { month: "May", adoptions: 18, requests: 22 },
  { month: "Jun", adoptions: 22, requests: 28 },
  { month: "Jul", adoptions: 17, requests: 21 },
];

const speciesData = [
  { name: "Dogs", value: 45 },
  { name: "Cats", value: 35 },
  { name: "Rabbits", value: 12 },
  { name: "Birds", value: 5 },
  { name: "Other", value: 3 },
];

const ageData = [
  { age: "0-6m", count: 15 },
  { age: "6m-1y", count: 22 },
  { age: "1-3y", count: 31 },
  { age: "3-7y", count: 20 },
  { age: "7y+", count: 10 },
];

const COLORS = ["#089D97", "#47BDB8", "#80CECE", "#047975", "#B2E0DF"];

interface ManagerAnalyticsPageProps { onNavigate: (page: string) => void; }

export default function ManagerAnalyticsPage({ onNavigate }: ManagerAnalyticsPageProps) {
  const { t } = useLanguage();
  const [period, setPeriod] = useState("7m");

  return (
    <DashboardLayout role="manager" activePage="manager-analytics" onNavigate={onNavigate} pageTitle={t("manager_analytics")} breadcrumbs={[t("role_manager"), t("manager_analytics")]}>
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

      {/* Monthly adoption trend */}
      <div className="bg-white rounded-[15px] shadow-md p-5 mb-5">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">{t("analytics_monthly_adoptions_requests")}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyAdoptions} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 10 }} />
            <Legend wrapperStyle={{ fontFamily: "Poppins", fontSize: 12 }} />
            <Line type="monotone" dataKey="adoptions" stroke="#089D97" strokeWidth={2.5} dot={{ fill: "#089D97", r: 4 }} />
            <Line type="monotone" dataKey="requests" stroke="#80CECE" strokeWidth={2.5} strokeDasharray="5 4" dot={{ fill: "#80CECE", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Species distribution */}
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">{t("analytics_adoptions_by_species")}</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie data={speciesData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {speciesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2">
              {speciesData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                  <span className="font-['Poppins',sans-serif] text-[12px] text-black/70">{t(`species_${s.name.toLowerCase()}`) === `species_${s.name.toLowerCase()}` ? s.name : t(`species_${s.name.toLowerCase()}`)}</span>
                  <span className="font-['Poppins',sans-serif] text-[12px] font-semibold text-black ml-auto">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Age distribution */}
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">{t("analytics_age_distribution")}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="age" tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 10 }} />
              <Bar dataKey="count" fill="#089D97" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Success rate */}
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">{t("analytics_success_rate")}</h3>
        <div className="flex flex-wrap gap-6">
          {[
            { label: t("report_total_requests"), value: 138, color: "text-black" },
            { label: t("status_approved"), value: 102, color: "text-green-600" },
            { label: t("status_rejected"), value: 23, color: "text-red-500" },
            { label: t("status_pending"), value: 13, color: "text-yellow-600" },
            { label: t("analytics_success_rate"), value: "73.9%", color: "text-[#089D97]" },
          ].map((s) => (
            <div key={s.label} className="text-center min-w-[100px]">
              <p className={`font-['Poppins',sans-serif] font-semibold text-[28px] ${s.color}`}>{s.value}</p>
              <p className="font-['Poppins',sans-serif] text-[12px] text-black/60">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
