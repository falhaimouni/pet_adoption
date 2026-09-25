import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import KpiCard from "../../components/KpiCard";
import { Users, PawPrint, Heart, MessageSquare } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../lib/api";
import type { AdminDashboardDto, UserActivityAnalyticsDto } from "@shared/dto";

const COLORS = ["#089D97", "#47BDB8", "#80CECE", "#047975", "#B2E0DF"];

interface AdminAnalyticsPageProps { onNavigate: (page: string) => void; }

export default function AdminAnalyticsPage({ onNavigate }: AdminAnalyticsPageProps) {
  const { t, lang } = useLanguage();
  const [period, setPeriod] = useState("7m");
  const [dashboard, setDashboard] = useState<AdminDashboardDto | null>(null);
  const [activity, setActivity] = useState<UserActivityAnalyticsDto | null>(null);
  const [adoptionReport, setAdoptionReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const [dashboardData, activityData, adoptionData] = await Promise.all([
          apiFetch<AdminDashboardDto>("/dashboard/admin"),
          apiFetch<UserActivityAnalyticsDto>("/dashboard/user-activity?limit=5"),
          apiFetch<ReportResponse>("/reports/adoptions"),
        ]);

        if (!active) return;
        setDashboard(dashboardData);
        setActivity(activityData);
        setAdoptionReport(adoptionData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : t("dashboard_load_error"));
        setDashboard(null);
        setActivity(null);
        setAdoptionReport(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [t]);

  const numberFormatter = new Intl.NumberFormat(lang === "ar" ? "ar-JO" : lang);
  const userActivityTrend = useMemo(
    () =>
      (activity?.trend ?? []).map((item) => ({
        date: formatDateLabel(item.date, lang),
        activities: item.count,
        activeUsers: item.uniqueUsers,
      })),
    [activity, lang],
  );
  const roleDistribution = useMemo(
    () => [
      { name: t("role_adopters"), value: dashboard?.users.adopter ?? 0 },
      { name: t("role_employee_plural"), value: dashboard?.users.employee ?? 0 },
      { name: t("role_vets"), value: dashboard?.users.vet ?? 0 },
      { name: t("role_managers"), value: dashboard?.users.manager ?? 0 },
      { name: t("role_admins"), value: dashboard?.users.admin ?? 0 },
    ],
    [dashboard, t],
  );
  const adoptionTrend = useMemo(() => adoptionStatusByMonth(adoptionReport?.data ?? [], lang), [adoptionReport, lang]);
  const topUsers = activity?.topUsers ?? [];
  const value = (metric?: number) => loading ? "..." : numberFormatter.format(metric ?? 0);

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
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-[12px] border border-red-100 bg-red-50 px-4 py-3">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <p className="font-['Poppins',sans-serif] text-[13px] text-red-600">{error}</p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<Users size={20} />} label={t("admin_total_users")} value={value(dashboard?.users.total)} />
        <KpiCard icon={<PawPrint size={20} />} label={t("analytics_pets_listed")} value={value(dashboard?.pets.total)} />
        <KpiCard icon={<Heart size={20} />} label={t("nav_adoptions")} value={value(dashboard?.adoptions.approved)} />
        <KpiCard icon={<MessageSquare size={20} />} label={t("admin_total_activities")} value={value(activity?.summary.totalActivities)} />
      </div>

      {/* User growth */}
      <div className="bg-white rounded-[15px] shadow-md p-5 mb-5">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">{t("admin_user_activity_over_time")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={userActivityTrend} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#089D97" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#089D97" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 10 }} />
            <Area type="monotone" dataKey="activities" stroke="#089D97" strokeWidth={2.5} fill="url(#userGrad)" />
            <Line type="monotone" dataKey="activeUsers" stroke="#80CECE" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
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
                  <span className="font-['Poppins',sans-serif] text-[12px] text-black/70">{r.name}</span>
                  <span className="font-['Poppins',sans-serif] text-[12px] font-semibold text-black ms-auto">{r.value}</span>
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

      {/* Top users */}
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{t("admin_user_activity_summary")}</h3>
          <p className="font-['Poppins',sans-serif] text-[13px] text-black/50">{t("admin_unique_active_users")}: {value(activity?.summary.uniqueActiveUsers)}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topUsers.length === 0 && <p className="font-['Poppins',sans-serif] text-[13px] text-black/40">{t("admin_no_activity_analytics")}</p>}
          {topUsers.map((user, i) => (
            <div key={user.userId} className="rounded-[12px] bg-[#f0f8f7] p-4">
              <div className="w-8 h-8 rounded-full mb-2 flex items-center justify-center font-['Poppins',sans-serif] text-[12px] font-semibold text-white" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</div>
              <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black truncate">{user.firstName} {user.lastName}</p>
              <p className="font-['Poppins',sans-serif] text-[11px] text-black/50 truncate">{user.email}</p>
              <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-[#089D97] mt-2">{numberFormatter.format(user.activityCount)}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

interface ReportResponse {
  summary: Record<string, string | number>;
  data: Record<string, unknown>[];
}

function formatDateLabel(value: string, lang: string) {
  const locale = lang === "ar" ? "ar-JO" : lang;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00Z`));
}

function adoptionStatusByMonth(rows: Record<string, unknown>[], lang: string) {
  const locale = lang === "ar" ? "ar-JO" : lang;
  const months = new Map<string, { month: string; adoptions: number; rejections: number }>();

  rows.forEach((row) => {
    const rawDate = typeof row.requestDate === "string" ? row.requestDate : "";
    const date = rawDate ? new Date(rawDate) : null;
    if (!date || Number.isNaN(date.getTime())) return;

    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
    const current = months.get(key) ?? { month: label, adoptions: 0, rejections: 0 };
    const status = String(row.status ?? "").toUpperCase();

    if (status === "APPROVED") current.adoptions += 1;
    if (status === "REJECTED" || status === "CANCELED" || status === "CANCELLED") current.rejections += 1;

    months.set(key, current);
  });

  return [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
}
