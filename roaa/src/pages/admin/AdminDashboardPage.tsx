import {
  Users, Shield, Package, Tag, HardDrive, FileText,
  BarChart2, Activity, ArrowUpRight, TrendingUp, AlertTriangle, UserCheck, Heart,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import KpiCard from "../../components/KpiCard";

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
}

const userGrowth = [
  { month: "Jan", users: 120 },
  { month: "Feb", users: 168 },
  { month: "Mar", users: 210 },
  { month: "Apr", users: 265 },
  { month: "May", users: 330 },
  { month: "Jun", users: 402 },
  { month: "Jul", users: 486 },
];

const roleDistribution = [
  { name: "Adopters", value: 380, color: "#089D97" },
  { name: "Staff", value: 42, color: "#047975" },
  { name: "Vets", value: 18, color: "#80bdba" },
  { name: "Managers", value: 12, color: "#bae0dd" },
  { name: "Admins", value: 4, color: "#1a2e2d" },
];

const features = [
  { id: "admin-pets", label: "Pets", desc: "Add adoptable pets", icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
  { id: "admin-users", label: "Users", desc: "Manage all accounts", icon: Users, color: "text-[#089D97]", bg: "bg-[#e0f2f0]" },
  { id: "admin-roles", label: "Roles & Permissions", desc: "Access control", icon: Shield, color: "text-violet-600", bg: "bg-violet-50" },
  { id: "admin-inventory", label: "Inventory", desc: "Stock & products", icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
  { id: "admin-suppliers", label: "Suppliers", desc: "Vendor directory", icon: Tag, color: "text-sky-600", bg: "bg-sky-50" },
  { id: "admin-files", label: "Files", desc: "Documents & media", icon: HardDrive, color: "text-rose-600", bg: "bg-rose-50" },
  { id: "admin-reports", label: "Reports", desc: "Generate reports", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
  { id: "admin-analytics", label: "Analytics", desc: "Platform insights", icon: BarChart2, color: "text-teal-600", bg: "bg-teal-50" },
  { id: "admin-activity", label: "Activity Log", desc: "Audit trail", icon: Activity, color: "text-orange-600", bg: "bg-orange-50" },
];

const recentActivity = [
  { id: 1, action: "New user registered", detail: "sarah_j joined as Adopter", time: "5m ago", icon: UserCheck, color: "text-green-600" },
  { id: 2, action: "Role updated", detail: "alex_r promoted to Manager", time: "1h ago", icon: Shield, color: "text-violet-600" },
  { id: 3, action: "Low inventory", detail: "Flea Treatment — 3 units left", time: "3h ago", icon: AlertTriangle, color: "text-amber-600" },
  { id: 4, action: "Report generated", detail: "Monthly adoptions summary", time: "6h ago", icon: FileText, color: "text-indigo-600" },
];

export default function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  return (
    <DashboardLayout role="admin" activePage="admin-dashboard" onNavigate={onNavigate} pageTitle="Admin Dashboard" breadcrumbs={["Admin", "Dashboard"]}>
      {/* KPIs */}
      <div className="flex flex-wrap gap-4 mb-6">
        <KpiCard label="Total Users" value={486} icon={<Users size={20} />} trend={21} trendLabel="vs last month" />
        <KpiCard label="Active Staff" value={72} icon={<UserCheck size={20} />} trend={4} accent="bg-green-50" />
        <KpiCard label="Total Adoptions" value={318} icon={<TrendingUp size={20} />} trend={9} accent="bg-teal-50" />
        <KpiCard label="Inventory Alerts" value={3} icon={<AlertTriangle size={20} />} accent="bg-red-50" />
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
        {/* User growth */}
        <div className="lg:col-span-2 bg-white rounded-[16px] p-5 shadow-sm">
          <h3 className="font-['Poppins',sans-serif] font-semibold text-[15px] text-black mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={userGrowth}>
              <defs>
                <linearGradient id="uGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#089D97" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#089D97" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0f2f0" />
              <XAxis dataKey="month" stroke="#5a8a87" fontSize={12} />
              <YAxis stroke="#5a8a87" fontSize={12} />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#089D97" strokeWidth={2} fill="url(#uGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

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
          <button onClick={() => onNavigate("admin-activity")} className="font-['Poppins',sans-serif] text-[13px] text-[#089D97] hover:underline">
            View all
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {recentActivity.map(({ id, action, detail, time, icon: Icon, color }) => (
            <div key={id} className="flex items-center gap-3 py-2 border-b border-[#f0f8f7] last:border-0">
              <div className="w-9 h-9 rounded-full bg-[#f0f8f7] flex items-center justify-center flex-shrink-0">
                <Icon size={16} className={color} />
              </div>
              <div className="flex-1">
                <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-black">{action}</p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-[#5a8a87]">{detail}</p>
              </div>
              <span className="font-['Poppins',sans-serif] text-[11px] text-gray-400 whitespace-nowrap">{time}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
