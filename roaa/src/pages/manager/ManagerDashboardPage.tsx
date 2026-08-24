import { Heart, ClipboardList, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import KpiCard from "../../components/KpiCard";
import Badge, { statusBadge } from "../../components/Badge";

const adoptionTrend = [
  { month: "Jan", adoptions: 8 },
  { month: "Feb", adoptions: 12 },
  { month: "Mar", adoptions: 10 },
  { month: "Apr", adoptions: 15 },
  { month: "May", adoptions: 18 },
  { month: "Jun", adoptions: 22 },
  { month: "Jul", adoptions: 17 },
];

const recentActivity = [
  { id: 1, action: "Adoption approved", detail: "Roaa A. — Max (Golden Retriever)", time: "2h ago", type: "success" },
  { id: 2, action: "Low inventory alert", detail: "Flea Treatment — 3 units left", time: "4h ago", type: "warning" },
  { id: 3, action: "New adoption request", detail: "Ali M. — Luna (Persian Cat)", time: "6h ago", type: "info" },
  { id: 4, action: "Appointment scheduled", detail: "Max — Vaccine due Jul 20", time: "1d ago", type: "info" },
];

const inventoryAlerts = [
  { item: "Flea Treatment", qty: 3, min: 10, status: "critical" },
  { item: "Dog Food (Premium)", qty: 8, min: 20, status: "low" },
  { item: "Cat Litter", qty: 5, min: 15, status: "low" },
];

interface ManagerDashboardPageProps { onNavigate: (page: string) => void; }

export default function ManagerDashboardPage({ onNavigate }: ManagerDashboardPageProps) {
  return (
    <DashboardLayout role="manager" activePage="manager-dashboard" onNavigate={onNavigate} pageTitle="Manager Dashboard" breadcrumbs={["Manager", "Dashboard"]}>
      {/* KPIs */}
      <div className="flex flex-wrap gap-4 mb-6">
        <KpiCard label="Pets Available" value={42} icon={<Heart size={20} />} trend={5} trendLabel="vs last month" />
        <KpiCard label="Adoptions This Month" value={17} icon={<ShoppingCart size={20} />} trend={12} trendLabel="Jun → Jul" accent="bg-green-50" />
        <KpiCard label="Pending Requests" value={8} icon={<ClipboardList size={20} />} trend={-3} accent="bg-yellow-50" />
        <KpiCard label="Inventory Alerts" value={3} icon={<AlertTriangle size={20} />} accent="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Adoption trend chart */}
        <div className="lg:col-span-2 bg-white rounded-[15px] shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">Adoption Trend</h3>
            <button onClick={() => onNavigate("manager-analytics")} className="font-['Poppins',sans-serif] text-[12px] text-[#089D97] hover:underline">Full analytics →</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={adoptionTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adoptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#089D97" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#089D97" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: "Poppins", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: "Poppins", fontSize: 12, borderRadius: 10, border: "1px solid #e5e7eb" }} />
              <Area type="monotone" dataKey="adoptions" stroke="#089D97" strokeWidth={2} fill="url(#adoptGrad)" dot={{ fill: "#089D97", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory alerts */}
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">Inventory Alerts</h3>
            <button onClick={() => onNavigate("manager-inventory")} className="font-['Poppins',sans-serif] text-[12px] text-[#089D97] hover:underline">Manage</button>
          </div>
          <div className="flex flex-col gap-3">
            {inventoryAlerts.map((a) => (
              <div key={a.item} className="flex items-center justify-between p-3 rounded-[10px] bg-[rgba(8,157,151,0.04)] border border-[rgba(8,157,151,0.1)]">
                <div>
                  <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-black">{a.item}</p>
                  <p className="font-['Poppins',sans-serif] text-[11px] text-black/50">{a.qty} / {a.min} min</p>
                </div>
                <Badge label={a.status} variant={a.status === "critical" ? "rejected" : "warning"} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">Recent Activity</h3>
        <div className="flex flex-col divide-y divide-gray-50">
          {recentActivity.map((a) => (
            <div key={a.id} className="flex items-start gap-3 py-3">
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.type === "success" ? "bg-green-500" : a.type === "warning" ? "bg-yellow-400" : "bg-[#089D97]"}`} />
              <div className="flex-1">
                <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-black">{a.action}</p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-black/50">{a.detail}</p>
              </div>
              <span className="font-['Poppins',sans-serif] text-[11px] text-black/40 shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
