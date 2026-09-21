import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Download } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../lib/api";

const COLORS = ["#089D97", "#47BDB8", "#80CECE", "#047975", "#B2E0DF"];

interface ManagerAnalyticsPageProps { onNavigate: (page: string) => void; }

export default function ManagerAnalyticsPage({ onNavigate }: ManagerAnalyticsPageProps) {
  const { t, lang } = useLanguage();
  const [period, setPeriod] = useState("7m");
  const [adoptionReport, setAdoptionReport] = useState<ReportResponse | null>(null);
  const [petReport, setPetReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const [adoptions, pets] = await Promise.all([
          apiFetch<ReportResponse>("/reports/adoptions"),
          apiFetch<ReportResponse>("/reports/pets"),
        ]);

        if (!active) return;
        setAdoptionReport(adoptions);
        setPetReport(pets);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : t("dashboard_load_error"));
        setAdoptionReport(null);
        setPetReport(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [t]);

  const monthlyAdoptions = useMemo(() => monthlyAdoptionData(adoptionReport?.data ?? [], lang), [adoptionReport, lang]);
  const speciesData = useMemo(() => speciesBreakdown(petReport?.data ?? []), [petReport]);
  const ageData = useMemo(() => ageBreakdown(petReport?.data ?? []), [petReport]);
  const summary = adoptionReport?.summary ?? {};
  const totalRequests = Number(summary.totalRequests ?? 0);
  const approved = Number(summary.approved ?? 0);
  const rejected = Number(summary.rejected ?? 0);
  const pending = Number(summary.pending ?? 0);
  const successRate = String(summary.approvalRate ?? "0%");

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
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-[12px] border border-red-100 bg-red-50 px-4 py-3">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <p className="font-['Poppins',sans-serif] text-[13px] text-red-600">{error}</p>
        </div>
      )}

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
        {!loading && monthlyAdoptions.length === 0 && <p className="font-['Poppins',sans-serif] text-[13px] text-black/40 text-center">{t("report_no_data")}</p>}
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
                  <span className="font-['Poppins',sans-serif] text-[12px] text-black/70">{s.name}</span>
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
            { label: t("report_total_requests"), value: loading ? "..." : totalRequests, color: "text-black" },
            { label: t("status_approved"), value: loading ? "..." : approved, color: "text-green-600" },
            { label: t("status_rejected"), value: loading ? "..." : rejected, color: "text-red-500" },
            { label: t("status_pending"), value: loading ? "..." : pending, color: "text-yellow-600" },
            { label: t("analytics_success_rate"), value: loading ? "..." : successRate, color: "text-[#089D97]" },
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

interface ReportResponse {
  summary: Record<string, string | number>;
  data: Record<string, unknown>[];
}

function monthlyAdoptionData(rows: Record<string, unknown>[], lang: string) {
  const locale = lang === "ar" ? "ar-JO" : lang;
  const months = new Map<string, { month: string; adoptions: number; requests: number }>();

  rows.forEach((row) => {
    const rawDate = typeof row.requestDate === "string" ? row.requestDate : "";
    const date = rawDate ? new Date(rawDate) : null;
    if (!date || Number.isNaN(date.getTime())) return;

    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const month = new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
    const current = months.get(key) ?? { month, adoptions: 0, requests: 0 };

    current.requests += 1;
    if (String(row.status ?? "").toUpperCase() === "APPROVED") current.adoptions += 1;

    months.set(key, current);
  });

  return [...months.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
}

function speciesBreakdown(rows: Record<string, unknown>[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const species = String(row.species ?? "Other") || "Other";
    counts.set(species, (counts.get(species) ?? 0) + 1);
  });

  const total = rows.length || 1;
  return [...counts.entries()].map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }));
}

function ageBreakdown(rows: Record<string, unknown>[]) {
  const buckets = [
    { age: "0-6m", min: 0, max: 0.5, count: 0 },
    { age: "6m-1y", min: 0.5, max: 1, count: 0 },
    { age: "1-3y", min: 1, max: 3, count: 0 },
    { age: "3-7y", min: 3, max: 7, count: 0 },
    { age: "7y+", min: 7, max: Number.POSITIVE_INFINITY, count: 0 },
  ];

  rows.forEach((row) => {
    const age = Number(row.age ?? 0);
    const bucket = buckets.find((item) => age >= item.min && age < item.max) ?? buckets[buckets.length - 1];
    bucket.count += 1;
  });

  return buckets.map(({ age, count }) => ({ age, count }));
}
