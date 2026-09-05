import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Eye } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";
import type { UserRole } from "../../context/AuthContext";

interface Supplier {
  supplierId: string;
  supplierName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  isActive?: boolean;
  supplies?: Array<{ supplyId: string; supplyName: string; category?: string | null }>;
}

const emptyForm = { supplierName: "", phone: "", email: "", address: "", city: "", country: "" };

interface AdminSuppliersPageProps {
  onNavigate: (page: string) => void;
  role?: UserRole;
  activePage?: string;
}

export default function AdminSuppliersPage({ onNavigate, role = "admin", activePage = "admin-suppliers" }: AdminSuppliersPageProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<Supplier | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [deleteItem, setDeleteItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const canDelete = role === "admin" || role === "manager";

  const filtered = suppliers.filter((s) => {
    const query = search.toLowerCase();
    return s.supplierName.toLowerCase().includes(query) || (s.city ?? "").toLowerCase().includes(query);
  });

  function loadSuppliers() {
    setLoading(true);
    setError("");
    apiFetch<Supplier[]>("/inventory/suppliers")
      .then(setSuppliers)
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load suppliers."))
      .finally(() => setLoading(false));
  }

  useEffect(loadSuppliers, []);

  function openAdd() {
    setForm(emptyForm);
    setFormError("");
    setAddOpen(true);
  }

  function openEdit(s: Supplier) {
    setForm({
      supplierName: s.supplierName,
      phone: s.phone ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
      city: s.city ?? "",
      country: s.country ?? "",
    });
    setFormError("");
    setEditItem(s);
  }

  async function openView(s: Supplier) {
    setViewItem(s);
    try {
      setViewItem(await apiFetch<Supplier>(`/inventory/suppliers/${s.supplierId}`));
    } catch {
      setViewItem(s);
    }
  }

  async function saveSupplier() {
    if (!form.supplierName.trim()) {
      setFormError("Supplier name is required.");
      return;
    }
    const body = {
      supplierName: form.supplierName.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      country: form.country.trim() || undefined,
    };
    setSaving(true);
    setFormError("");
    try {
      await apiFetch(editItem ? `/inventory/suppliers/${editItem.supplierId}` : "/inventory/suppliers", {
        method: editItem ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setForm(emptyForm);
      setAddOpen(false);
      setEditItem(null);
      loadSuppliers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save supplier.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSupplier() {
    if (!deleteItem) return;
    setSaving(true);
    try {
      await apiFetch(`/inventory/suppliers/${deleteItem.supplierId}`, { method: "DELETE" });
      setDeleteItem(null);
      loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete supplier.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role={role} activePage={activePage} onNavigate={onNavigate} pageTitle="Suppliers" breadcrumbs={[role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Staff", "Suppliers"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder="Search by name or city..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors ml-auto">
            <Plus size={15} /> Add Supplier
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((n) => <div key={n} className="h-12 rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<Mail size={26} />} title="Unable to load suppliers" description={error} actionLabel="Try again" onAction={loadSuppliers} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Mail size={26} />} title="No suppliers found" description="Supplier records will appear here after they are added." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Supplier", "Phone", "Email", "City", "Country", "Status", "Actions"].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.supplierId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black whitespace-nowrap">{s.supplierName}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{s.phone ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{s.email ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{s.city ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{s.country ?? "-"}</td>
                    <td className="py-3 px-3"><Badge label={s.isActive === false ? "inactive" : "active"} variant={statusBadge(s.isActive === false ? "inactive" : "active")} /></td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => openView(s)} className="text-[#089D97] hover:text-[#047975] transition-colors"><Eye size={14} /></button>
                        <button onClick={() => openEdit(s)} className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                        {canDelete && <button onClick={() => setDeleteItem(s)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{filtered.length} suppliers</p>
          <Pagination page={page} totalPages={1} onPage={setPage} />
        </div>
      </div>

      <Modal title="Supplier Details" open={!!viewItem} onClose={() => setViewItem(null)} size="sm">
        {viewItem && (
          <div className="space-y-3">
            <div className="pb-3 border-b border-gray-100">
              <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{viewItem.supplierName}</p>
              <Badge label={viewItem.isActive === false ? "inactive" : "active"} variant={statusBadge(viewItem.isActive === false ? "inactive" : "active")} />
            </div>
            <div className="flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] text-black/60"><Phone size={13} className="text-[#089D97]" /> {viewItem.phone ?? "-"}</div>
            <div className="flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] text-black/60"><Mail size={13} className="text-[#089D97]" /> {viewItem.email ?? "-"}</div>
            <div className="flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] text-black/60"><MapPin size={13} className="text-[#089D97]" /> {[viewItem.address, viewItem.city, viewItem.country].filter(Boolean).join(", ") || "-"}</div>
            <div className="pt-2 border-t border-gray-100 flex justify-between">
              <span className="font-['Poppins',sans-serif] text-[12px] text-black/50">Linked Supplies</span>
              <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black">{viewItem.supplies?.length ?? 0}</span>
            </div>
            <div>
              <span className="font-['Poppins',sans-serif] text-[12px] text-black/50 block mb-1">Supplies</span>
              <div className="flex gap-1 flex-wrap">
                {(viewItem.supplies ?? []).length === 0 ? (
                  <span className="font-['Poppins',sans-serif] text-[12px] text-black/50">No linked supplies</span>
                ) : (
                  viewItem.supplies?.map((supply) => (
                    <span key={supply.supplyId} className="px-2 py-0.5 rounded-[6px] bg-[rgba(8,157,151,0.1)] text-[#047975] font-['Poppins',sans-serif] text-[11px] font-medium">{supply.supplyName}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal title={editItem ? "Edit Supplier" : "Add Supplier"} open={addOpen || !!editItem} onClose={() => { setAddOpen(false); setEditItem(null); }} onConfirm={saveSupplier} confirmLabel={saving ? "Saving..." : "Save"} size="md">
        <div className="grid grid-cols-2 gap-4">
          {formError && <p className="col-span-2 text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{formError}</p>}
          {[{ label: "Supplier Name", field: "supplierName" as const, span: 2 }, { label: "City", field: "city" as const, span: 1 }, { label: "Country", field: "country" as const, span: 1 }, { label: "Phone", field: "phone" as const, span: 1 }, { label: "Email", field: "email" as const, span: 1 }, { label: "Address", field: "address" as const, span: 2 }].map(({ label, field, span }) => (
            <div key={field} className={span === 2 ? "col-span-2" : ""}>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
              <input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
            </div>
          ))}
        </div>
      </Modal>

      <Modal title="Delete Supplier" open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={deleteSupplier} confirmLabel={saving ? "Deleting..." : "Delete"} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Remove <span className="font-semibold">{deleteItem?.supplierName}</span> from your supplier list?</p>
      </Modal>
    </DashboardLayout>
  );
}
