import { useEffect, useState } from "react";
import { Heart, ClipboardList, ShoppingCart, Package, AlertTriangle } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import KpiCard from "../../components/KpiCard";
import Badge, { statusBadge } from "../../components/Badge";
import { apiFetch } from "../../lib/api";

const inventoryAlerts: Array<{ item: string; qty: number; min: number; status: string }> = [];

interface DashboardData {
  pets: { available: number; adopted: number; pendingAdoption: number };
  adoptions: { pending: number; approved: number; totalRequests: number };
  supplies: { availableSupplies?: number; lowStockSupplies: number; totalSuppliers: number };
  activity: { recentActivityLogs: Array<{ logId: string; action: string; entityType: string; createdAt: string; user?: { firstName: string; lastName: string } | null }> };
}

interface ManagerDashboardPageProps { onNavigate: (page: string) => void; }

export default function ManagerDashboardPage({ onNavigate }: ManagerDashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DashboardData>("/dashboard/manager")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load dashboard."));
  }, []);

  const recentActivity = data?.activity.recentActivityLogs ?? [];

  return (
    <DashboardLayout role="manager" activePage="manager-dashboard" onNavigate={onNavigate} pageTitle="Manager Dashboard" breadcrumbs={["Manager", "Dashboard"]}>
      {/* KPIs */}
      <div className="flex flex-wrap gap-4 mb-6">
        <KpiCard label="Pets Available" value={data?.pets.available ?? "..."} icon={<Heart size={20} />} trendLabel={error || "Live backend data"} />
        <KpiCard label="Approved Requests" value={data?.adoptions.approved ?? "..."} icon={<ShoppingCart size={20} />} accent="bg-green-50" />
        <KpiCard label="Pending Requests" value={data?.adoptions.pending ?? "..."} icon={<ClipboardList size={20} />} accent="bg-yellow-50" />
        <KpiCard label="Inventory Alerts" value={data?.supplies.lowStockSupplies ?? "..."} icon={<AlertTriangle size={20} />} accent="bg-red-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Adoption trend */}
        <div className="lg:col-span-2 bg-white rounded-[15px] shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">Adoption Trend</h3>
          </div>
          <p className="font-['Poppins',sans-serif] text-[13px] text-black/40 py-16 text-center">Trend data is not included in the current dashboard response.</p>
        </div>

        {/* Inventory alerts */}
        <div className="bg-white rounded-[15px] shadow-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">Inventory Alerts</h3>
            <button onClick={() => onNavigate("manager-inventory")} className="font-['Poppins',sans-serif] text-[12px] text-[#089D97] hover:underline">Manage</button>
          </div>
          <div className="flex flex-col gap-3">
            {inventoryAlerts.length === 0 && <p className="font-['Poppins',sans-serif] text-[13px] text-black/40">Use Inventory for detailed low-stock supply records.</p>}
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
          {recentActivity.length === 0 && <p className="font-['Poppins',sans-serif] text-[13px] text-black/40">No recent activity.</p>}
          {recentActivity.map((a) => (
            <div key={a.logId} className="flex items-start gap-3 py-3">
              <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-[#089D97]" />
              <div className="flex-1">
                <p className="font-['Poppins',sans-serif] font-medium text-[13px] text-black">{a.action}</p>
                <p className="font-['Poppins',sans-serif] text-[12px] text-black/50">{a.entityType} {a.user ? `by ${a.user.firstName} ${a.user.lastName}` : ""}</p>
              </div>
              <span className="font-['Poppins',sans-serif] text-[11px] text-black/40 shrink-0">{a.createdAt.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
