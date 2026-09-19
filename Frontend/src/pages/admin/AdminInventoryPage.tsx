import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Edit, EyeOff, ImagePlus, Package, Plus, Search, Settings, Trash2 } from "lucide-react";
import Badge, { statusBadge } from "../../components/Badge";
import DashboardLayout, { Role } from "../../components/DashboardLayout";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { apiFetch } from "../../lib/api";
import { validateImageFile } from "../../lib/validation";
import { useLanguage } from "../../context/LanguageContext";

type SupplyStatus = "AVAILABLE" | "OUT_OF_STOCK" | "EXPIRED" | "DAMAGED" | "DISCONTINUED";

interface Supply {
  supplyId: string;
  supplyName: string;
  category: string;
  quantity: number;
  sellingPrice: string;
  purchasePrice: string;
  lowStockLimit: number;
  supplierId: string;
  supplier?: Supplier | null;
  deliveryTimeDays?: number | null;
  minimumOrderQuantity: number;
  status: SupplyStatus;
  storeListed: boolean;
  lastUpdated?: string;
}

interface Supplier {
  supplierId: string;
  supplierName: string;
  isActive: boolean;
}

interface SuppliesResponse {
  data: Supply[];
  total: number;
  page: number;
  limit: number;
}

interface AdminInventoryPageProps {
  onNavigate: (page: string) => void;
  role?: Role;
  activePage?: string;
}

const categories = ["FOOD", "MEDICAL", "TOYS", "BEDDING", "CLEANING", "EQUIPMENT", "OTHER"];
const statuses: SupplyStatus[] = ["AVAILABLE", "OUT_OF_STOCK", "EXPIRED", "DAMAGED", "DISCONTINUED"];

const blankForm = {
  supplyName: "",
  category: "FOOD",
  quantity: "1",
  sellingPrice: "",
  purchasePrice: "",
  lowStockLimit: "1",
  supplierId: "",
  deliveryTimeDays: "",
  minimumOrderQuantity: "1",
  status: "AVAILABLE" as SupplyStatus,
  storeListed: true,
};

function toMoney(value: string) {
  return Number(value).toFixed(2);
}

function toInteger(value: string) {
  return Number.parseInt(value, 10);
}

function supplyStatusLabel(supply: Supply) {
  if (supply.status === "AVAILABLE" && supply.quantity <= 0) return "OUT_OF_STOCK";
  if (supply.status === "AVAILABLE" && supply.quantity <= supply.lowStockLimit) return "LOW_STOCK";
  return supply.status;
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function supplyCategoryKey(category: string) {
  return `supply_category_${category.toLowerCase()}`;
}

export default function AdminInventoryPage({ onNavigate, role = "admin", activePage = "admin-inventory" }: AdminInventoryPageProps) {
  const { t } = useLanguage();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Supply | null>(null);
  const [deleteItem, setDeleteItem] = useState<Supply | null>(null);
  const [imageSupply, setImageSupply] = useState<Supply | null>(null);
  const [form, setForm] = useState(blankForm);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const title = role === "admin" ? t("admin_inventory_mgmt") : t("manager_inventory");
  const breadcrumbs = [t(`role_${role}`), t("manager_inventory")];
  const totalPages = Math.max(1, Math.ceil(total / 10));
  const canDeleteSupplies = role === "admin" || role === "manager";
  const canDeactivateStoreListing = role === "employee";
  const canUploadSupplyImages = role === "admin" || role === "manager" || role === "employee";

  const alertCount = useMemo(
    () => supplies.filter((item) => item.status === "OUT_OF_STOCK" || (item.status === "AVAILABLE" && item.quantity <= item.lowStockLimit)).length,
    [supplies],
  );

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadSupplies();
  }, [page, search, category, status]);

  async function loadSuppliers() {
    try {
      const data = await apiFetch<Supplier[]>("/inventory/suppliers");
      setSuppliers(data.filter((supplier) => supplier.isActive !== false));
    } catch (err) {
      setError(readError(err, "Could not load suppliers."));
    }
  }

  async function loadSupplies() {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      isActive: "true",
      sortBy: "supplyName",
      order: "ASC",
    });
    if (search.trim()) params.set("search", search.trim());
    if (category !== "all") params.set("category", category);

    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<SuppliesResponse>(`/inventory/supplies?${params}`);
      const filtered = status === "all" ? response.data : response.data.filter((item) => supplyStatusLabel(item) === status);
      setSupplies(filtered);
      setTotal(status === "all" ? response.total : filtered.length);
    } catch (err) {
      setError(readError(err, "Could not load inventory."));
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...blankForm, supplierId: suppliers[0]?.supplierId ?? "" });
    setFormError("");
    setAddOpen(true);
  }

  function openEdit(item: Supply) {
    setEditing(item);
    setForm({
      supplyName: item.supplyName,
      category: item.category,
      quantity: String(item.quantity),
      sellingPrice: String(item.sellingPrice),
      purchasePrice: String(item.purchasePrice),
      lowStockLimit: String(item.lowStockLimit),
      supplierId: item.supplierId,
      deliveryTimeDays: item.deliveryTimeDays == null ? "" : String(item.deliveryTimeDays),
      minimumOrderQuantity: String(item.minimumOrderQuantity),
      status: item.status,
      storeListed: item.storeListed !== false,
    });
    setFormError("");
    setAddOpen(true);
  }

  function validateForm() {
    if (!form.supplyName.trim()) return "Supply name is required.";
    if (form.supplyName.trim().length > 160) return "Supply name must be 160 characters or fewer.";
    if (!categories.includes(form.category)) return "Choose a valid category.";
    if (!form.supplierId) return "Choose a supplier before adding a supply.";
    if (!Number.isInteger(Number(form.quantity)) || toInteger(form.quantity) < 0) return "Quantity must be a whole number of 0 or more.";
    if (!Number.isInteger(Number(form.lowStockLimit)) || toInteger(form.lowStockLimit) < 0) return "Low stock limit must be a whole number of 0 or more.";
    if (!Number.isInteger(Number(form.minimumOrderQuantity)) || toInteger(form.minimumOrderQuantity) < 1) return "Minimum order quantity must be at least 1.";
    if (form.deliveryTimeDays && (!Number.isInteger(Number(form.deliveryTimeDays)) || toInteger(form.deliveryTimeDays) < 0)) return "Delivery time must be a whole number of 0 or more.";
    if (!Number.isFinite(Number(form.sellingPrice)) || Number(form.sellingPrice) < 0) return "Selling price must be 0 or more.";
    if (!Number.isFinite(Number(form.purchasePrice)) || Number(form.purchasePrice) < 0) return "Purchase price must be 0 or more.";
    if (!statuses.includes(form.status)) return "Choose a valid status.";
    return "";
  }

  async function saveSupply() {
    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const body = {
      supplyName: form.supplyName.trim(),
      category: form.category,
      quantity: toInteger(form.quantity),
      sellingPrice: Number(toMoney(form.sellingPrice)),
      purchasePrice: Number(toMoney(form.purchasePrice)),
      lowStockLimit: toInteger(form.lowStockLimit),
      deliveryTimeDays: form.deliveryTimeDays ? toInteger(form.deliveryTimeDays) : undefined,
      minimumOrderQuantity: toInteger(form.minimumOrderQuantity),
      status: form.status,
      storeListed: form.storeListed,
    };
    const requestBody = editing ? body : { ...body, supplierId: form.supplierId };

    setSaving(true);
    setFormError("");
    setSuccess("");
    try {
      await apiFetch<Supply>(editing ? `/inventory/supplies/${editing.supplyId}` : "/inventory/supplies", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(requestBody),
      });
      setSuccess(editing ? "Supply updated." : "Supply added. It will appear in the shop when active, available, and in stock.");
      setAddOpen(false);
      setEditing(null);
      await loadSupplies();
    } catch (err) {
      setFormError(readError(err, "Could not save supply."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteSupply() {
    if (!deleteItem) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const endpoint = canDeleteSupplies ? `/inventory/supplies/${deleteItem.supplyId}` : `/store/supplies/${deleteItem.supplyId}`;
      await apiFetch<{ success: boolean; message: string }>(endpoint, { method: "DELETE" });
      setSuccess(canDeleteSupplies ? t("supply_delete_success") : t("supply_deactivate_success"));
      setDeleteItem(null);
      await loadSupplies();
    } catch (err) {
      setError(readError(err, canDeleteSupplies ? t("supply_delete_error") : t("supply_deactivate_error")));
    } finally {
      setSaving(false);
    }
  }

  function openImageUpload(item: Supply) {
    setImageSupply(item);
    setError("");
    setSuccess("");
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function uploadSupplyImage(file?: File) {
    if (!imageSupply) return;
    if (!file) {
      setError("Please choose an image file first.");
      return;
    }
    const validation = validateImageFile(file, t);
    if (validation) {
      setError(validation);
      return;
    }

    const body = new FormData();
    body.append("file", file);

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await apiFetch<{ imageUrl: string }>(`/inventory/supplies/${imageSupply.supplyId}/image`, {
        method: "POST",
        body,
      });
      setSuccess(`Image updated for ${imageSupply.supplyName}.`);
      setImageSupply(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      await loadSupplies();
    } catch (err) {
      setError(readError(err, "Unable to upload supply image."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role={role} activePage={activePage} onNavigate={onNavigate} pageTitle={title} breadcrumbs={breadcrumbs}>
      {alertCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-[12px] px-4 py-3 mb-5">
          <AlertTriangle size={16} className="text-yellow-600 shrink-0" />
          <p className="font-['Poppins',sans-serif] text-[13px] text-yellow-800">
            <span className="font-semibold">{t("inventory_alert_count").replace("{count}", String(alertCount))}</span> {t("inventory_alert_suffix")}
          </p>
          {role === "admin" && (
            <button onClick={() => onNavigate("admin-suppliers")} className="ml-auto font-['Poppins',sans-serif] text-[12px] text-yellow-700 underline whitespace-nowrap">{t("inventory_manage_suppliers")}</button>
          )}
        </div>
      )}

      <div className="bg-white rounded-[15px] shadow-md p-4 sm:p-5">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[190px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input
              placeholder={t("inventory_search_supplies")}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
            />
          </div>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[12px] bg-white outline-none focus:border-[#089D97]">
            <option value="all">{t("report_all_categories")}</option>
            {categories.map((item) => <option key={item} value={item}>{t(supplyCategoryKey(item))}</option>)}
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[12px] bg-white outline-none focus:border-[#089D97]">
            <option value="all">{t("inventory_all_stock")}</option>
            <option value="AVAILABLE">{t("status_available")}</option>
            <option value="LOW_STOCK">{t("status_low_stock")}</option>
            <option value="OUT_OF_STOCK">{t("status_out_of_stock")}</option>
            <option value="EXPIRED">{t("status_expired")}</option>
            <option value="DAMAGED">{t("status_damaged")}</option>
            <option value="DISCONTINUED">{t("status_discontinued")}</option>
          </select>
          <div className="flex gap-2 ml-auto">
            {role === "admin" && (
              <button onClick={() => onNavigate("admin-suppliers")} className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-black/60 font-['Poppins',sans-serif] text-[12px] rounded-[10px] hover:bg-gray-50 transition-colors">
                <Settings size={14} /> {t("nav_suppliers")}
              </button>
            )}
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors">
              <Plus size={15} /> {t("inventory_add_supply")}
            </button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-[10px] bg-red-50 border border-red-100 px-4 py-3 font-['Poppins',sans-serif] text-[13px] text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded-[10px] bg-emerald-50 border border-emerald-100 px-4 py-3 font-['Poppins',sans-serif] text-[13px] text-emerald-700">{success}</div>}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((row) => <div key={row} className="h-12 bg-gray-100 rounded-[10px] animate-pulse" />)}
          </div>
        ) : supplies.length === 0 ? (
          <EmptyState icon={<Package size={28} />} title={t("inventory_empty_title")} description={t("inventory_empty_desc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("th_name"), t("th_category"), t("th_qty"), t("inventory_low"), t("th_supplier"), t("inventory_price"), t("inventory_store"), t("th_status"), t("th_actions")].map((heading) => (
                    <th key={heading} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {supplies.map((item) => {
                  const label = supplyStatusLabel(item);
                  return (
                    <tr key={item.supplyId} className={`border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors ${label === "LOW_STOCK" ? "bg-yellow-50/40" : ""}`}>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black min-w-[180px]">
                        {(label === "OUT_OF_STOCK" || label === "LOW_STOCK") && <AlertTriangle size={12} className="text-yellow-500 inline mr-1" />}
                        {item.supplyName}
                      </td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{t(supplyCategoryKey(item.category))}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] font-semibold text-[13px] text-black">{item.quantity}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/50">{item.lowStockLimit}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{item.supplier?.supplierName ?? item.supplierId}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/70">${Number(item.sellingPrice).toFixed(2)}</td>
                      <td className="py-3 px-3"><Badge label={item.storeListed === false ? "hidden" : "listed"} variant={item.storeListed === false ? "neutral" : "success"} /></td>
                      <td className="py-3 px-3"><Badge label={label.replace("_", " ").toLowerCase()} variant={statusBadge(label.toLowerCase())} /></td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2 items-center">
                          <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700 transition-colors" aria-label={`Edit ${item.supplyName}`}><Edit size={14} /></button>
                          {canUploadSupplyImages && (
                            <button onClick={() => openImageUpload(item)} className="text-amber-500 hover:text-amber-700 transition-colors" aria-label={`Upload image for ${item.supplyName}`}><ImagePlus size={14} /></button>
                          )}
                          {canDeleteSupplies && (
                            <button onClick={() => setDeleteItem(item)} className="text-red-400 hover:text-red-600 transition-colors" aria-label={`Delete ${item.supplyName}`}><Trash2 size={14} /></button>
                          )}
                          {canDeactivateStoreListing && item.storeListed !== false && (
                            <button onClick={() => setDeleteItem(item)} className="text-amber-500 hover:text-amber-700 transition-colors" aria-label={`Deactivate ${item.supplyName} from store`}><EyeOff size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
      </div>

      <Modal title={editing ? t("inventory_edit_supply") : t("inventory_add_supply")} open={addOpen} onClose={() => { setAddOpen(false); setEditing(null); }} onConfirm={saveSupply} confirmLabel={saving ? t("common_saving") : t("inventory_save_supply")} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {formError && <div className="sm:col-span-2 rounded-[10px] bg-red-50 border border-red-100 px-4 py-3 font-['Poppins',sans-serif] text-[13px] text-red-700">{formError}</div>}
          {suppliers.length === 0 && (
            <div className="sm:col-span-2 rounded-[10px] bg-yellow-50 border border-yellow-100 px-4 py-3 font-['Poppins',sans-serif] text-[13px] text-yellow-800">
              {t("inventory_need_supplier")}
            </div>
          )}
          <label className="sm:col-span-2 block">
            <span className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("inventory_supply_name")}</span>
            <input value={form.supplyName} maxLength={160} onChange={(e) => setForm((f) => ({ ...f, supplyName: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </label>
          <label className="block">
            <span className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_category")}</span>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors">
              {categories.map((item) => <option key={item} value={item}>{t(supplyCategoryKey(item))}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_supplier")}</span>
            <select value={form.supplierId} disabled={!!editing} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors disabled:bg-gray-50">
              <option value="">{t("inventory_choose_supplier")}</option>
              {suppliers.map((supplier) => <option key={supplier.supplierId} value={supplier.supplierId}>{supplier.supplierName}</option>)}
            </select>
          </label>
          {[
            [t("inventory_quantity"), "quantity", "0"],
            [t("inventory_low_stock_limit"), "lowStockLimit", "0"],
            [t("inventory_selling_price"), "sellingPrice", "0.00"],
            [t("inventory_purchase_price"), "purchasePrice", "0.00"],
            [t("inventory_delivery_days"), "deliveryTimeDays", "0"],
            [t("inventory_min_order_qty"), "minimumOrderQuantity", "1"],
          ].map(([label, field, min]) => (
            <label key={field} className="block">
              <span className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</span>
              <input
                type="number"
                min={min}
                step={field.includes("Price") ? "0.01" : "1"}
                value={form[field as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
              />
            </label>
          ))}
          <label className="block">
            <span className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("th_status")}</span>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as SupplyStatus }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors">
              {statuses.map((item) => <option key={item} value={item}>{t(`status_${item.toLowerCase()}`)}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2 flex items-center gap-3 rounded-[10px] border border-gray-200 px-3 py-2">
            <input
              type="checkbox"
              checked={form.storeListed}
              onChange={(e) => setForm((f) => ({ ...f, storeListed: e.target.checked }))}
              className="h-4 w-4 accent-[#089D97]"
            />
            <span className="font-['Poppins',sans-serif] text-[13px] text-black/70">{t("inventory_listed_store")}</span>
          </label>
        </div>
      </Modal>

      <Modal title={canDeleteSupplies ? t("inventory_delete_supply") : t("inventory_deactivate_listing")} open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={deleteSupply} confirmLabel={saving ? (canDeleteSupplies ? t("common_deleting") : t("common_deactivating")) : (canDeleteSupplies ? t("action_delete") : t("action_deactivate"))} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
          {(canDeleteSupplies ? t("inventory_delete_confirm") : t("inventory_deactivate_confirm")).replace("{name}", deleteItem?.supplyName ?? "")}
        </p>
      </Modal>

      <Modal title="Upload Supply Image" open={!!imageSupply} onClose={() => setImageSupply(null)} onConfirm={() => uploadSupplyImage(imageInputRef.current?.files?.[0])} confirmLabel={saving ? t("pet_uploading") : t("action_upload")} size="sm">
        <input ref={imageInputRef} type="file" accept="image/*,.jpg,.jpeg,.png,.webp" className="w-full text-[13px] font-['Poppins',sans-serif]" />
        <p className="mt-2 font-['Poppins',sans-serif] text-[12px] text-black/50">{t("pet_upload_hint")}</p>
      </Modal>
    </DashboardLayout>
  );
}
