import { Stethoscope, Syringe, ClipboardList, Plus, ArrowRight } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import KpiCard from "../../components/KpiCard";
import { useLanguage } from "../../context/LanguageContext";

const RECENT_ACTIVITY = [
  { id: 1, pet: "Max", action: "General Checkup", date: "Today, 09:15 AM", type: "checkup" },
  { id: 2, pet: "Luna", action: "Rabies Vaccine Administered", date: "Today, 10:00 AM", type: "vaccine" },
  { id: 3, pet: "Lola", action: "Illness — Ear Infection", date: "Yesterday, 03:30 PM", type: "illness" },
  { id: 4, pet: "Shadow", action: "Post-Surgery Follow-up", date: "Yesterday, 11:00 AM", type: "surgery" },
  { id: 5, pet: "Buddy", action: "DHPP Vaccine Administered", date: "2026-07-28", type: "vaccine" },
];

const VACCINATIONS_DUE = [
  { id: 1, pet: "Max", vaccine: "DHPP Booster", dueDate: "Aug 20, 2026", status: "due" },
  { id: 2, pet: "Cleo", vaccine: "Rabies", dueDate: "Aug 22, 2026", status: "due" },
  { id: 3, pet: "Rocky", vaccine: "Bordetella", dueDate: "Sep 1, 2026", status: "upcoming" },
  { id: 4, pet: "Mochi", vaccine: "Leptospirosis", dueDate: "Aug 18, 2026", status: "overdue" },
];

function activityIcon(type: string) {
  if (type === "vaccine") return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><Syringe size={14} className="text-blue-500" /></div>;
  if (type === "surgery") return <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0"><Stethoscope size={14} className="text-red-500" /></div>;
  if (type === "illness") return <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><ClipboardList size={14} className="text-orange-500" /></div>;
  return <div className="w-8 h-8 rounded-full bg-[rgba(8,157,151,0.12)] flex items-center justify-center flex-shrink-0"><Stethoscope size={14} className="text-[#089D97]" /></div>;
}

function vaccineStatusColor(status: string) {
  if (status === "overdue") return "text-red-500 bg-red-50";
  if (status === "due") return "text-amber-600 bg-amber-50";
  return "text-[#089D97] bg-[rgba(8,157,151,0.1)]";
}

interface VetDashboardPageProps { onNavigate: (page: string, params?: Record<string, unknown>) => void; }

export default function VetDashboardPage({ onNavigate }: VetDashboardPageProps) {
  const { t } = useLanguage();

  const QUICK_ACTIONS = [
    { label: t("vet_add_entry"), page: "vet-medical", icon: <Stethoscope size={15} /> },
    { label: t("vet_add_vaccination"), page: "vet-vaccinations", icon: <Syringe size={15} /> },
    { label: t("vet_medical_records"), page: "vet-medical", icon: <ClipboardList size={15} /> },
  ];

  return (
    <DashboardLayout role="vet" activePage="vet-dashboard" onNavigate={onNavigate} pageTitle={t("nav_dashboard")} breadcrumbs={["Vet", t("nav_dashboard")]}>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label={t("vet_patients")} value="7" icon={<Stethoscope size={20} />} trend={12} trendValue="+2 vs yesterday" />
        <KpiCard label={t("vet_vaccinations_due")} value="11" icon={<Syringe size={20} />} accent="bg-blue-100" trend={-3} />
        <KpiCard label={t("vet_cases_open")} value="4" icon={<ClipboardList size={20} />} accent="bg-orange-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-[15px] shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{t("vet_medical_records")}</h3>
            <button onClick={() => onNavigate("vet-medical")} className="font-['Poppins',sans-serif] text-[12px] text-[#089D97] hover:underline flex items-center gap-1">{t("dash_view_all")} <ArrowRight size={12} /></button>
          </div>
          <div className="flex flex-col gap-3">
            {RECENT_ACTIVITY.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                {activityIcon(a.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-black">{a.pet} <span className="font-normal text-black/60">— {a.action}</span></p>
                  <p className="font-['Poppins',sans-serif] text-[11px] text-black/40">{a.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-[15px] shadow-md p-5">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-3">{t("dash_quick_actions")}</h3>
            <div className="flex flex-col gap-2">
              {QUICK_ACTIONS.map(({ label, page, icon }) => (
                <button key={label} onClick={() => onNavigate(page)} className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] border border-gray-200 hover:border-[#089D97] hover:bg-[rgba(8,157,151,0.04)] transition-all text-left group">
                  <span className="text-[#089D97]">{icon}</span>
                  <span className="font-['Poppins',sans-serif] text-[13px] text-black group-hover:text-[#089D97] transition-colors">{label}</span>
                  <ArrowRight size={12} className="ml-auto text-gray-300 group-hover:text-[#089D97] transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Vaccinations Due */}
          <div className="bg-white rounded-[15px] shadow-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">{t("vet_vaccinations_due")}</h3>
              <button onClick={() => onNavigate("vet-vaccinations")} className="font-['Poppins',sans-serif] text-[12px] text-[#089D97] hover:underline">{t("dash_view_all")}</button>
            </div>
            <div className="flex flex-col gap-2">
              {VACCINATIONS_DUE.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-black">{v.pet}</p>
                    <p className="font-['Poppins',sans-serif] text-[11px] text-black/50">{v.vaccine}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-['Poppins',sans-serif] text-[10px] font-semibold capitalize ${vaccineStatusColor(v.status)}`}>{v.status}</span>
                    <p className="font-['Poppins',sans-serif] text-[10px] text-black/40 mt-0.5">{v.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => onNavigate("vet-vaccinations")} className="mt-3 w-full flex items-center justify-center gap-2 py-2 border border-dashed border-[#089D97] text-[#089D97] rounded-[10px] font-['Poppins',sans-serif] text-[12px] hover:bg-[rgba(8,157,151,0.04)] transition-colors">
              <Plus size={13} /> {t("vet_add_vaccination")}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
