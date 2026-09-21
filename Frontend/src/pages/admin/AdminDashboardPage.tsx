import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  FileText,
  HeartHandshake,
  Package,
  PawPrint,
  Tag,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import KpiCard from "../../components/KpiCard";
import { apiFetch } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import type { AdminDashboardDto, UserActivityAnalyticsDto } from "@shared/dto";

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
}

type DashboardData = AdminDashboardDto;

const COLORS = ["#089D97", "#2563eb", "#f59e0b", "#ef4444", "#7c3aed"];

const features = [
  { id: "admin-users", labelKey: "nav_users", descKey: "admin_users_desc", icon: Users, color: "text-[#089D97]", bg: "bg-[#e0f2f0]" },
  { id: "admin-inventory", labelKey: "nav_inventory", descKey: "admin_inventory_desc", icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
  { id: "admin-suppliers", labelKey: "nav_suppliers", descKey: "admin_suppliers_desc", icon: Tag, color: "text-sky-600", bg: "bg-sky-50" },
  { id: "admin-reports", labelKey: "nav_reports", descKey: "admin_reports_desc", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
];

export default function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const { t, isRtl, lang } = useLanguage();
  const [data, setData] = useState<DashboardData | null>(null);
  const [activityAnalytics, setActivityAnalytics] = useState<UserActivityAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError("");

      try {
        const [dashboard, analytics] = await Promise.all([
          apiFetch<DashboardData>("/dashboard/admin"),
          apiFetch<UserActivityAnalyticsDto>("/dashboard/user-activity?limit=10"),
        ]);

        if (!active) return;
        setData(dashboard);
        setActivityAnalytics(analytics);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : t("dashboard_load_error"));
        setData(null);
        setActivityAnalytics(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [t]);

  const numberFormatter = new Intl.NumberFormat(lang === "ar" ? "ar-JO" : lang);
  const totalAdoptions = data?.adoptions.approved;

  const adoptionStatusData = useMemo(
    () => [
      { name: t("status_pending"), value: data?.adoptions.pending ?? 0, color: "#f59e0b" },
      { name: t("status_approved"), value: data?.adoptions.approved ?? 0, color: "#089D97" },
      { name: t("admin_status_rejected_canceled"), value: data?.adoptions.rejectedOrCanceled ?? 0, color: "#ef4444" },
    ],
    [data, t],
  );

  const activityActionData = useMemo(
    () =>
      (activityAnalytics?.actions ?? []).map((item) => ({
        name: translateActivityAction(item.name, t),
        count: item.count,
      })),
    [activityAnalytics, t],
  );

  const activityEntityData = useMemo(
    () =>
      (activityAnalytics?.entities ?? []).map((item) => ({
        name: translateEntity(item.name, t),
        count: item.count,
      })),
    [activityAnalytics, t],
  );

  const activityTrendData = useMemo(
    () =>
      (activityAnalytics?.trend ?? []).map((item) => ({
        label: formatTrendLabel(item.date, lang),
        count: item.count,
      })),
    [activityAnalytics, lang],
  );

  const overviewRows = [
    { label: t("metric_adoption_requests"), value: data?.adoptions.totalRequests },
    { label: t("metric_approved_requests"), value: data?.adoptions.approved },
    { label: t("metric_rejected_canceled_requests"), value: data?.adoptions.rejectedOrCanceled },
    { label: t("metric_available_pets"), value: data?.pets.available },
    { label: t("metric_adopted_pets"), value: data?.pets.adopted },
    { label: t("metric_pending_adoptions"), value: data?.pets.pendingAdoption },
    { label: t("metric_active_users"), value: data?.users.active },
    { label: t("metric_inactive_users"), value: data?.users.inactive },
    { label: t("metric_vaccinations"), value: data?.medical.totalVaccinations },
    { label: t("metric_low_stock_supplies"), value: data?.supplies.lowStockSupplies },
  ].filter((row) => row.value !== undefined);

  return (
    <DashboardLayout role="admin" activePage="admin-dashboard" onNavigate={onNavigate} pageTitle={t("admin_dashboard_title")} breadcrumbs={[t("admin"), t("admin_dashboard_crumb")]}> 
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label={t("admin_total_users")}
          value={metricValue(data?.users.total, loading, false, t, numberFormatter)}
          icon={<Users size={20} />}
        />
        <KpiCard
          label={t("metric_total_pets")}
          value={metricValue(data?.pets.total, loading, false, t, numberFormatter)}
          icon={<PawPrint size={20} />}
          accent="bg-teal-50"
        />
        <KpiCard
          label={t("admin_total_adoptions")}
          value={metricValue(totalAdoptions, loading, !!error, t, numberFormatter)}
          icon={<HeartHandshake size={20} />}
          accent="bg-rose-50"
        />
      </div>
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-[8px] border border-red-100 bg-red-50 px-4 py-3">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <p className="font-['Poppins',sans-serif] text-[13px] text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {features.map(({ id, labelKey, descKey, icon: Icon, color, bg }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="group bg-white rounded-[8px] p-5 shadow-sm hover:shadow-md transition-all text-left rtl:text-right border border-transparent hover:border-[#bae0dd]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-[8px] ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <ArrowUpRight size={16} className="text-gray-300 group-hover:text-[#089D97] transition-colors rtl:rotate-180" />
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">{t(labelKey)}</p>
            <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{t(descKey)}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <ChartCard title={t("admin_adoption_status_chart")} loading={loading} empty={!loading && adoptionStatusData.every((item) => item.value === 0)} emptyText={t("admin_no_metrics")}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={adoptionStatusData} margin={{ top: 10, right: isRtl ? 8 : 20, left: isRtl ? 20 : -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef5f4" />
              <XAxis dataKey="name" tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} reversed={isRtl} />
              <YAxis tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} orientation={isRtl ? "right" : "left"} allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {adoptionStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("admin_user_activity_actions")} loading={loading} empty={!loading && activityActionData.length === 0} emptyText={t("admin_no_activity_analytics")}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={activityActionData} layout="vertical" margin={{ top: 8, right: isRtl ? 8 : 24, left: isRtl ? 24 : 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef5f4" />
              <XAxis type="number" tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontFamily: "Poppins", fontSize: 11 }} width={130} axisLine={false} tickLine={false} orientation={isRtl ? "right" : "left"} />
              <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#089D97" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <ChartCard title={t("admin_user_activity_over_time")} loading={loading} empty={!loading && activityTrendData.length === 0} emptyText={t("admin_no_activity_analytics")}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={activityTrendData} margin={{ top: 8, right: isRtl ? 10 : 20, left: isRtl ? 20 : 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef5f4" />
              <XAxis dataKey="label" tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} reversed={isRtl} />
              <YAxis tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} orientation={isRtl ? "right" : "left"} />
              <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontFamily: "Poppins", fontSize: 11 }} />
              <Line type="monotone" dataKey="count" name={t("admin_total_activities")} stroke="#089D97" strokeWidth={2.5} dot={{ fill: "#089D97", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("admin_activity_by_entity")} loading={loading} empty={!loading && activityEntityData.length === 0} emptyText={t("admin_no_activity_analytics")}>
          {activityEntityData.length > 0 ? (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="w-full lg:w-[58%]">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={activityEntityData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2}>
                      {activityEntityData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {activityEntityData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                    <span className="font-['Poppins',sans-serif] text-[12px] text-black/70">{entry.name}</span>
                    <span className="ml-auto font-['Poppins',sans-serif] text-[12px] font-semibold text-black">{numberFormatter.format(entry.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="bg-white rounded-[8px] p-5 shadow-sm">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black mb-4">{t("admin_user_activity_summary")}</h3>
          {loading ? (
            <LoadingBlock />
          ) : activityAnalytics ? (
            <div className="grid grid-cols-1 gap-3">
              <MetricRow label={t("admin_total_activities")} value={numberFormatter.format(activityAnalytics.summary.totalActivities)} />
              <MetricRow label={t("admin_unique_active_users")} value={numberFormatter.format(activityAnalytics.summary.uniqueActiveUsers)} />
              <MetricRow label={t("admin_avg_activity_per_user")} value={numberFormatter.format(activityAnalytics.summary.averageActivitiesPerActiveUser)} />
            </div>
          ) : (
            <p className="font-['Poppins',sans-serif] text-[13px] text-black/50">{t("admin_no_activity_analytics")}</p>
          )}
        </div>

        <div className="xl:col-span-2 bg-white rounded-[8px] p-5 shadow-sm">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black mb-4">{t("admin_system_overview")}</h3>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-12 rounded-[8px] bg-[#f0f8f7] animate-pulse" />)}
            </div>
          ) : overviewRows.length === 0 ? (
            <p className="font-['Poppins',sans-serif] text-[13px] text-black/40">{t("admin_no_metrics")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {overviewRows.map((row) => (
                <MetricRow key={row.label} label={row.label} value={numberFormatter.format(Number(row.value ?? 0))} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[8px] p-5 shadow-sm">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black mb-4">{t("admin_role_distribution")}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={roleDistribution(data, t)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={2}>
                {roleDistribution(data, t).map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[8px] p-5 shadow-sm mt-5">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black mb-4">{t("admin_recent_activity")}</h3>
        <div className="flex flex-col gap-3">
          {loading && <LoadingBlock />}
          {!loading && (data?.activity.recentActivityLogs ?? []).length === 0 && (
            <p className="font-['Poppins',sans-serif] text-[13px] text-black/40">{t("admin_no_recent_activity")}</p>
          )}
          {(data?.activity.recentActivityLogs ?? []).map((item) => (
            <div key={item.logId} className="flex items-center gap-3 py-2 border-b border-[#f0f8f7] last:border-0">
              <div className="w-9 h-9 rounded-full bg-[#f0f8f7] flex items-center justify-center shrink-0">
                <Activity size={16} className="text-[#089D97]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-black truncate">{translateActivityAction(item.action, t)}</p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87] truncate">
                  {translateEntity(item.entityType, t)} {item.user ? `${t("admin_activity_by")} ${item.user.firstName} ${item.user.lastName}` : ""}
                </p>
              </div>
              <span className="font-['Poppins',sans-serif] text-[11px] text-gray-400 whitespace-nowrap">{formatActivityDate(item.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ChartCard({ title, loading, empty, emptyText, children }: { title: string; loading: boolean; empty: boolean; emptyText: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[8px] p-5 shadow-sm min-h-[320px]">
      <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black mb-4">{title}</h3>
      {loading ? <LoadingBlock /> : empty ? <EmptyAnalytics text={emptyText} /> : children}
    </div>
  );
}

function LoadingBlock() {
  return <div className="h-[220px] rounded-[8px] bg-[#f0f8f7] animate-pulse" />;
}

function EmptyAnalytics({ text }: { text: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-[8px] border border-dashed border-[#cfe7e4] bg-[#f8fcfb] px-4 text-center">
      <p className="font-['Poppins',sans-serif] text-[13px] leading-6 text-[#5a8a87]">{text}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] bg-[#f0f8f7] px-4 py-3">
      <span className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{label}</span>
      <span className="font-['Poppins',sans-serif] text-[14px] font-semibold text-black">{value}</span>
    </div>
  );
}

function roleDistribution(data: DashboardData | null, t: (key: string) => string) {
  return [
    { name: t("role_adopters"), value: data?.users.adopter ?? 0 },
    { name: t("role_employee_plural"), value: data?.users.employee ?? 0 },
    { name: t("role_vets"), value: data?.users.vet ?? 0 },
    { name: t("role_managers"), value: data?.users.manager ?? 0 },
    { name: t("role_admins"), value: data?.users.admin ?? 0 },
  ];
}

function translateActivityAction(value: string, t: (key: string) => string) {
  const key = `activity_action_${value.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? value.replaceAll("_", " ") : translated;
}

function translateEntity(value: string, t: (key: string) => string) {
  const key = `activity_entity_${value.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? value : translated;
}

function formatTrendLabel(value: string, lang: string) {
  const locale = lang === "ar" ? "ar-JO" : lang;
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
}

function formatActivityDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function metricValue(
  value: number | null | undefined,
  loading: boolean,
  unavailable: boolean,
  t: (key: string) => string,
  numberFormatter: Intl.NumberFormat,
) {
  if (loading) {
    return t("common_loading");
  }

  if (unavailable || value === null || value === undefined) {
    return t("common_unknown");
  }

  return numberFormatter.format(value);
}
