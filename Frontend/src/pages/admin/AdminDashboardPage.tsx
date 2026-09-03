import { useEffect, useState } from "react";
import {
  Users, Package, Tag, FileText,
  ArrowUpRight, TrendingUp, AlertTriangle, UserCheck, Activity,
} from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import KpiCard from "../../components/KpiCard";
import { apiFetch } from "../../lib/api";

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
}

interface DashboardData {
  users: { total: number; admin?: number; manager?: number; employee: number; vet: number; adopter: number; active?: number };
  pets: { total: number; available: number; adopted: number; pendingAdoption: number };
  adoptions: { totalRequests: number; pending: number; approved: number };
  medical: { petsNeedingMedicalAttention?: number };
  supplies: { lowStockSupplies: number; totalSuppliers: number };
  activity: { recentActivityLogs: Array<{ logId: string; action: string; entityType: string; createdAt: string; user?: { firstName: string; lastName: string } | null }> };
}

const features = [
  { id: "admin-users", label: "Users", desc: "Manage all accounts", icon: Users, color: "text-[#089D97]", bg: "bg-[#e0f2f0]" },
  { id: "admin-inventory", label: "Inventory", desc: "Stock & products", icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
  { id: "admin-suppliers", label: "Suppliers", desc: "Vendor directory", icon: Tag, color: "text-sky-600", bg: "bg-sky-50" },
  { id: "admin-reports", label: "Reports", desc: "Generate reports", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
];

export default function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DashboardData>("/dashboard/admin")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load dashboard."));
  }, []);

  const roleDistribution = [
    { name: "Adopters", value: data?.users.adopter ?? 0, color: "#089D97" },
    { name: "Staff", value: data?.users.employee ?? 0, color: "#047975" },
    { name: "Vets", value: data?.users.vet ?? 0, color: "#80bdba" },
    { name: "Managers", value: data?.users.manager ?? 0, color: "#bae0dd" },
    { name: "Admins", value: data?.users.admin ?? 0, color: "#1a2e2d" },
  ];
  const recentActivity = data?.activity.recentActivityLogs ?? [];

  return (
    <DashboardLayout role="admin" activePage="admin-dashboard" onNavigate={onNavigate} pageTitle="Admin Dashboard" breadcrumbs={["Admin", "Dashboard"]}>
      {/* KPIs */}
      <div className="flex flex-wrap gap-4 mb-6">
        <KpiCard label="Total Users" value={data?.users.total ?? "..."} icon={<Users size={20} />} trendLabel={error || "Live backend data"} />
        <KpiCard label="Active Staff" value={(data?.users.employee ?? 0) + (data?.users.vet ?? 0) + (data?.users.manager ?? 0)} icon={<UserCheck size={20} />} accent="bg-green-50" />
        <KpiCard label="Approved Requests" value={data?.adoptions.approved ?? "..."} icon={<TrendingUp size={20} />} accent="bg-teal-50" />
        <KpiCard label="Inventory Alerts" value={data?.supplies.lowStockSupplies ?? "..."} icon={<AlertTriangle size={20} />} accent="bg-red-50" />
      </div>

      {/* Feature cards */}
      <h2 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-3">Management Tools</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {features.map(({ id, label, desc, icon: Icon, color, bg }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="group bg-white rounded-[16px] p-5 shadow-sm hover:shadow-md transition-all text-left border border-transparent hover:border-[#bae0dd]"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-[12px] ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              <ArrowUpRight size={16} className="text-gray-300 group-hover:text-[#089D97] transition-colors" />
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">{label}</p>
            <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{desc}</p>
          </button>
        ))}
      </div>

      {/* Charts + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Role distribution */}
        <div className="bg-white rounded-[16px] p-5 shadow-sm">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black mb-4">Role Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {roleDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-3">
            {roleDistribution.map((r) => (
              <div key={r.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
                <span className="font-['Poppins',sans-serif] text-[12px] font-medium text-black">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-[16px] p-5 shadow-sm mt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black">Recent Activity</h3>
          <button onClick={() => onNavigate("admin-reports")} className="font-['Poppins',sans-serif] text-[13px] text-[#089D97] hover:underline">
            View all
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {recentActivity.length === 0 && <p className="font-['Poppins',sans-serif] text-[13px] text-black/40">No recent activity.</p>}
          {recentActivity.map((item) => (
            <div key={item.logId} className="flex items-center gap-3 py-2 border-b border-[#f0f8f7] last:border-0">
              <div className="w-9 h-9 rounded-full bg-[#f0f8f7] flex items-center justify-center flex-shrink-0">
                <Activity size={16} className="text-[#089D97]" />
              </div>
              <div className="flex-1">
                <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-black">{item.action}</p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{item.entityType} {item.user ? `by ${item.user.firstName} ${item.user.lastName}` : ""}</p>
              </div>
              <span className="font-['Poppins',sans-serif] text-[11px] text-gray-400 whitespace-nowrap">{item.createdAt.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
