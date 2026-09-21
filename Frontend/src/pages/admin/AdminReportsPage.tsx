import { useState } from "react";
import { Download, FileText, BarChart2, Package, Filter, ChevronDown, AlertCircle, RefreshCw } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import { useLanguage } from "../../context/LanguageContext";
import { apiBlobFetch, apiFetch } from "../../lib/api";

type ReportType = "adoptions" | "pets" | "inventory";
type ExportFmt = "csv" | "pdf";
interface ReportData { summary: Record<string, string | number>; data: Record<string, unknown>[]; }
function filtersToQuery(obj: Record<string, string>): string { const p = new URLSearchParams(); Object.entries(obj).forEach(([k,v])=>{if(v)p.set(k,v);}); const s=p.toString(); return s?`?${s}`:""; }
function FilterSelect({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}) { return (<div className="flex flex-col gap-1"><label className="font-['Poppins',sans-serif] text-[11px] text-black/50 uppercase tracking-wider">{label}</label><div className="relative"><select value={value} onChange={e=>onChange(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] bg-white transition-colors">{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none"/></div></div>); }
function FilterInput({label,value,onChange,placeholder,type="text"}:{label:string;value:string;onChange:(v:string)=>void;placeholder?:string;type?:string}) { return (<div className="flex flex-col gap-1"><label className="font-['Poppins',sans-serif] text-[11px] text-black/50 uppercase tracking-wider">{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="pl-3 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"/></div>); }
function SummaryCard({label,value}:{label:string;value:string|number}) { return (<div className="bg-[rgba(8,157,151,0.06)] rounded-[12px] p-4"><p className="font-['Poppins',sans-serif] text-[11px] text-black/50 uppercase tracking-wider mb-1">{label}</p><p className="font-['Poppins',sans-serif] font-semibold text-[20px] text-[#089D97]">{String(value)}</p></div>); }
function DataTable({data}:{data:Record<string,unknown>[]}) { if(!data.length)return null; const headers=Object.keys(data[0]); return (<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-gray-100">{headers.map(h=><th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{data.map((row,i)=><tr key={i} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">{headers.map(h=><td key={h} className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] text-black/70 whitespace-nowrap">{String(row[h]??"")}</td>)}</tr>)}</tbody></table></div>); }

interface AdminReportsPageProps { onNavigate: (page: string) => void; role?: "admin"|"manager"|"employee"|"vet"; activePage?: string; }

export default function AdminReportsPage({ onNavigate, role = "admin", activePage = "admin-reports" }: AdminReportsPageProps) {
  const { t } = useLanguage();
  const ACCESS: Record<ReportType, boolean> = {
    adoptions: ["admin","manager","employee"].includes(role),
    pets: ["admin","manager","employee","vet"].includes(role),
    inventory: ["admin","manager"].includes(role),
  };
  const availableTypes = (Object.keys(ACCESS) as ReportType[]).filter(k => ACCESS[k]);
  const [reportType, setReportType] = useState<ReportType>(availableTypes[0] ?? "adoptions");
  const [adoptionF, setAdoptionF] = useState({status:"",from:"",to:"",species:""});
  const [petsF, setPetsF] = useState({species:"",status:"",health:"",minAge:"",maxAge:""});
  const [inventoryF, setInventoryF] = useState({status:"",category:"",supplier:""});
  const [reportData, setReportData] = useState<ReportData|null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<ExportFmt|null>(null);
  const [error, setError] = useState("");

  function activeQ() {
    if(reportType==="adoptions") return filtersToQuery(adoptionF as Record<string,string>);
    if(reportType==="pets") return filtersToQuery(petsF as Record<string,string>);
    return filtersToQuery(inventoryF as Record<string,string>);
  }

  async function generate() {
    setLoading(true); setError(""); setReportData(null);
    try {
      const json = await apiFetch<{ summary?: Record<string, string | number>; data?: Record<string, unknown>[] }>(`/reports/${reportType}${activeQ()}`);
      setReportData({ summary: json.summary??{}, data: json.data??[] });
    } catch (err) { setError(err instanceof Error ? err.message : t("report_error")); }
    finally { setLoading(false); }
  }

  async function exportReport(fmt: ExportFmt) {
    setExporting(fmt);
    try {
      const blob = await apiBlobFetch(`/reports/${reportType}/export/${fmt}${activeQ()}`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href=url; a.download=`${reportType}-report.${fmt}`;
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (err) { setError(err instanceof Error ? err.message : t("report_error")); }
    finally { setExporting(null); }
  }

  const typeLabels: Record<ReportType,string> = { adoptions:t("report_type_adoptions"), pets:t("report_type_pets"), inventory:t("report_type_inventory") };
  const typeIcons: Record<ReportType,React.ReactNode> = { adoptions:<FileText size={16}/>, pets:<BarChart2 size={16}/>, inventory:<Package size={16}/> };

  return (
    <DashboardLayout role={role} activePage={activePage} onNavigate={onNavigate} pageTitle={t("action_generate")} breadcrumbs={[role, t("action_generate")]}>
      <div className="space-y-5">
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <div className="flex flex-wrap gap-2 mb-5">
            {availableTypes.map(type=>(
              <button key={type} onClick={()=>{setReportType(type);setReportData(null);setError("");}} className={`flex items-center gap-2 px-4 py-2 rounded-[10px] font-['Poppins',sans-serif] text-[13px] font-medium transition-colors ${reportType===type?"bg-[#089D97] text-white":"bg-gray-100 text-black/70 hover:bg-gray-200"}`}>
                {typeIcons[type]}{typeLabels[type]}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="flex items-center gap-1.5 font-['Poppins',sans-serif] text-[12px] font-semibold text-black/50 uppercase tracking-wider mb-3"><Filter size={13}/>{t("report_filters")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {reportType==="adoptions"&&<>
                <FilterSelect label={t("th_status")} value={adoptionF.status} onChange={v=>setAdoptionF(p=>({...p,status:v}))} options={[{value:"",label:t("report_all_statuses")},{value:"pending",label:t("status_pending")},{value:"approved",label:t("status_approved")},{value:"rejected",label:t("status_rejected")},{value:"cancelled",label:t("report_cancelled")}]}/>
                <FilterSelect label={t("th_species")} value={adoptionF.species} onChange={v=>setAdoptionF(p=>({...p,species:v}))} options={[{value:"",label:t("report_all_species")},{value:"dog",label:"Dog"},{value:"cat",label:"Cat"},{value:"rabbit",label:"Rabbit"}]}/>
                <FilterInput label={t("report_date_from")} type="date" value={adoptionF.from} onChange={v=>setAdoptionF(p=>({...p,from:v}))}/>
                <FilterInput label={t("report_date_to")} type="date" value={adoptionF.to} onChange={v=>setAdoptionF(p=>({...p,to:v}))}/>
              </>}
              {reportType==="pets"&&<>
                <FilterSelect label={t("th_species")} value={petsF.species} onChange={v=>setPetsF(p=>({...p,species:v}))} options={[{value:"",label:t("report_all_species")},{value:"dog",label:"Dog"},{value:"cat",label:"Cat"},{value:"rabbit",label:"Rabbit"}]}/>
                <FilterSelect label={t("th_status")} value={petsF.status} onChange={v=>setPetsF(p=>({...p,status:v}))} options={[{value:"",label:t("report_all_statuses")},{value:"available",label:t("status_available")},{value:"pending",label:t("status_pending")},{value:"adopted",label:t("status_adopted")}]}/>
                <FilterSelect label={t("report_health")} value={petsF.health} onChange={v=>setPetsF(p=>({...p,health:v}))} options={[{value:"",label:t("report_all_health")},{value:"VACCINATED",label:t("vet_vaccinated")},{value:"PENDING",label:t("status_pending")},{value:"OVERDUE",label:t("status_overdue")}]}/>
                <FilterInput label={t("report_min_age")} type="number" value={petsF.minAge} onChange={v=>setPetsF(p=>({...p,minAge:v}))} placeholder="0"/>
                <FilterInput label={t("report_max_age")} type="number" value={petsF.maxAge} onChange={v=>setPetsF(p=>({...p,maxAge:v}))} placeholder="20"/>
              </>}
              {reportType==="inventory"&&<>
                <FilterSelect label={t("th_status")} value={inventoryF.status} onChange={v=>setInventoryF(p=>({...p,status:v}))} options={[{value:"",label:t("report_all_statuses")},{value:"OK",label:t("status_in_stock")},{value:"LOW_STOCK",label:t("status_low_stock")},{value:"OUT_OF_STOCK",label:t("status_out_of_stock")}]}/>
                <FilterInput label={t("th_category")} value={inventoryF.category} onChange={v=>setInventoryF(p=>({...p,category:v}))} placeholder={t("report_all_categories")}/>
                <FilterInput label={t("th_supplier")} value={inventoryF.supplier} onChange={v=>setInventoryF(p=>({...p,supplier:v}))} placeholder={t("report_all_suppliers")}/>
              </>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            <button onClick={generate} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white rounded-[10px] font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-[#047975] transition-colors disabled:opacity-60">
              <RefreshCw size={14} className={loading?"animate-spin":""}/>{loading?t("report_generating"):t("action_generate")}
            </button>
            {reportData&&<>
              <button onClick={()=>exportReport("csv")} disabled={!!exporting} className="flex items-center gap-2 px-4 py-2 border border-[#089D97] text-[#089D97] rounded-[10px] font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-[rgba(8,157,151,0.06)] transition-colors disabled:opacity-60">
                <Download size={14}/>{exporting==="csv"?t("report_exporting"):t("report_export_csv")}
              </button>
              <button onClick={()=>exportReport("pdf")} disabled={!!exporting} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-black/70 rounded-[10px] font-['Poppins',sans-serif] text-[13px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-60">
                <Download size={14}/>{exporting==="pdf"?t("report_exporting"):t("report_export_pdf")}
              </button>
            </>}
          </div>
        </div>
        {error&&<div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-[12px] px-4 py-3"><AlertCircle size={16} className="text-red-500 shrink-0"/><p className="font-['Poppins',sans-serif] text-[13px] text-red-600">{error}</p></div>}
        {reportData?(
          <div className="space-y-4">
            {Object.keys(reportData.summary).length>0&&<div>
              <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black/60 uppercase tracking-wider mb-3">{t("report_summary")}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{Object.entries(reportData.summary).map(([k,v])=><SummaryCard key={k} label={k} value={v}/>)}</div>
            </div>}
            <div className="bg-white rounded-[15px] shadow-md p-5">
              <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black mb-4">{t("report_results")}</p>
              {reportData.data.length===0?<p className="font-['Poppins',sans-serif] text-[13px] text-black/40 text-center py-8">{t("report_no_data")}</p>:<DataTable data={reportData.data}/>}
            </div>
          </div>
        ):!loading&&!error&&(
          <div className="bg-white rounded-[15px] shadow-md p-10 text-center">
            <BarChart2 size={40} className="text-[#089D97] opacity-30 mx-auto mb-3"/>
            <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-black/50">{t("report_no_data")}</p>
            <p className="font-['Poppins',sans-serif] text-[12px] text-black/30 mt-1">{t("report_no_data_desc")}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
