import { useText } from "../../i18n/useText";
import { formSchemas } from "../../lib/formValidation";
import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Eye } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import EmptyState from "../../components/EmptyState";
import { apiFetch } from "../../lib/api";
import type { UserRole } from "../../context/AuthContext";
import { COMMON_CITY_OPTIONS, COMMON_COUNTRY_OPTIONS } from "../../lib/formOptions";
import { useLanguage } from "../../context/LanguageContext";

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

type SupplierFormField = {
  labelKey: string;
  field: keyof typeof emptyForm;
  span: 1 | 2;
  list?: string;
  options?: readonly string[];
};

const supplierFormFields: SupplierFormField[] = [
  { labelKey: "supplier_name", field: "supplierName", span: 2 },
  { labelKey: "th_city", field: "city", span: 1, list: "supplier-cities", options: COMMON_CITY_OPTIONS },
  { labelKey: "supplier_country", field: "country", span: 1, list: "supplier-countries", options: COMMON_COUNTRY_OPTIONS },
  { labelKey: "field_phone", field: "phone", span: 1 },
  { labelKey: "field_email", field: "email", span: 1 },
  { labelKey: "field_address", field: "address", span: 2 },
];

interface AdminSuppliersPageProps {
  onNavigate: (page: string) => void;
  role?: UserRole;
  activePage?: string;
}

export default function AdminSuppliersPage({ onNavigate, role = "admin", activePage = "admin-suppliers" }: AdminSuppliersPageProps) {
  const tx = useText();
  const { t } = useLanguage();
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
      .catch((err) => setError(err instanceof Error ? err.message : t("suppliers_load_error")))
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
      setFormError(t("supplier_name_required"));
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
      setFormError(err instanceof Error ? err.message : t("supplier_save_error"));
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
      setError(err instanceof Error ? err.message : t("supplier_delete_error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role={role} activePage={activePage} onNavigate={onNavigate} pageTitle={t("nav_suppliers")} breadcrumbs={[t(`role_${role}`), t("nav_suppliers")]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder={t("admin_search_supplier")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full ps-8 pe-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors ms-auto">
            <Plus size={15} /> {t("supplier_add")}
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((n) => <div key={n} className="h-12 rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<Mail size={26} />} title={t("suppliers_load_error")} description={error} actionLabel={t("common_try_again")} onAction={loadSuppliers} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Mail size={26} />} title={t("suppliers_empty_title")} description={t("suppliers_empty_desc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("th_supplier"), t("field_phone"), t("field_email"), t("th_city"), t("supplier_country"), t("th_status"), t("th_actions")].map((h) => (
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
          <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{t("suppliers_count").replace("{count}", String(filtered.length))}</p>
          <Pagination page={page} totalPages={1} onPage={setPage} />
        </div>
      </div>

      <Modal title={t("supplier_details")} open={!!viewItem} onClose={() => setViewItem(null)} size="sm">
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
              <span className="font-['Poppins',sans-serif] text-[12px] text-black/50">{t("supplier_linked_supplies")}</span>
              <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black">{viewItem.supplies?.length ?? 0}</span>
            </div>
            <div>
              <span className="font-['Poppins',sans-serif] text-[12px] text-black/50 block mb-1">{t("nav_inventory")}</span>
              <div className="flex gap-1 flex-wrap">
                {(viewItem.supplies ?? []).length === 0 ? (
                  <span className="font-['Poppins',sans-serif] text-[12px] text-black/50">{t("supplier_no_linked_supplies")}</span>
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

      <Modal title={editItem ? t("supplier_edit") : t("supplier_add")} open={addOpen || !!editItem} onClose={() => { setAddOpen(false); setEditItem(null); }} onConfirm={saveSupplier} confirmLabel={saving ? t("common_saving") : t("action_save")} size="md">
        <div className="grid grid-cols-2 gap-4">
          {formError && <p role="alert" className="whitespace-pre-line col-span-2 text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{formError}</p>}
          {supplierFormFields.map(({ labelKey, field, span, list, options }) => (
            <div key={field} className={span === 2 ? "col-span-2" : ""}>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t(labelKey)}</label>
              <input required={!editItem} maxLength={formSchemas.supplier[field].max} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} aria-label={t(labelKey)} list={list} value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
              {list && options && (
                <datalist id={list}>
                  {options.map((option) => <option key={option} value={option} />)}
                </datalist>
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal title={t("supplier_delete")} open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={deleteSupplier} confirmLabel={saving ? t("common_deleting") : t("action_delete")} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">{t("supplier_delete_confirm").replace("{name}", deleteItem?.supplierName ?? "")}</p>
      </Modal>
    </DashboardLayout>
  );
}
