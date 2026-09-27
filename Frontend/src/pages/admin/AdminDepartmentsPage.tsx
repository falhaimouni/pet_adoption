import { useText } from "../../i18n/useText";
import { useEffect, useState } from "react";
import { Building2, Edit, Eye, Power, Plus, Search, Users } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import EmptyState from "../../components/EmptyState";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { apiFetch } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";

interface DepartmentUser {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: { roleName?: string | null } | null;
}

interface DepartmentEmployee {
  employeeId?: string;
  userId?: string;
  user?: DepartmentUser | null;
}

interface DepartmentRecord {
  departmentId: string;
  departmentName: string;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  manager?: DepartmentUser | null;
  employeeCount?: number;
  employees?: DepartmentEmployee[];
}

const emptyForm = { departmentName: "", description: "" };

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : "-";
}

function fullName(user?: DepartmentUser | null) {
  if (!user) return "-";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email || "-";
}

function employeeCount(department: DepartmentRecord) {
  return department.employeeCount ?? department.employees?.length ?? 0;
}

export default function AdminDepartmentsPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const tx = useText();
  const { t } = useLanguage();
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [viewItem, setViewItem] = useState<DepartmentRecord | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<DepartmentRecord | null>(null);
  const [deleteItem, setDeleteItem] = useState<DepartmentRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const filtered = departments.filter((department) => {
    const query = search.toLowerCase();
    return (
      department.departmentName.toLowerCase().includes(query) ||
      (department.description ?? "").toLowerCase().includes(query)
    );
  });

  function loadDepartments() {
    setLoading(true);
    setError("");
    apiFetch<DepartmentRecord[]>("/departments")
      .then(setDepartments)
      .catch((err) => setError(err instanceof Error ? err.message : t("departments_unable_load")))
      .finally(() => setLoading(false));
  }

  useEffect(loadDepartments, []);

  function openAdd() {
    setForm(emptyForm);
    setFormError("");
    setAddOpen(true);
  }

  function openEdit(department: DepartmentRecord) {
    setForm({
      departmentName: department.departmentName,
      description: department.description ?? "",
    });
    setFormError("");
    setEditItem(department);
  }

  async function openView(department: DepartmentRecord) {
    setViewItem(department);
    try {
      setViewItem(await apiFetch<DepartmentRecord>(`/departments/${department.departmentId}`));
    } catch {
      setViewItem(department);
    }
  }

  function closeForm() {
    setAddOpen(false);
    setEditItem(null);
    setFormError("");
  }

  async function saveDepartment() {
    const departmentName = form.departmentName.trim();
    const description = form.description.trim();
    if (!departmentName) {
      setFormError(t("error_department_name_required"));
      return;
    }
    if (departmentName.length > 120) {
      setFormError(t("error_department_name_length"));
      return;
    }
    if (description.length > 1000) {
      setFormError(t("error_department_desc_length"));
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await apiFetch(editItem ? `/departments/${editItem.departmentId}` : "/departments", {
        method: editItem ? "PATCH" : "POST",
        body: JSON.stringify({
          departmentName,
          description: description || undefined,
        }),
      });
      setForm(emptyForm);
      closeForm();
      loadDepartments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("error_save_department"));
    } finally {
      setSaving(false);
    }
  }

  async function deleteDepartment() {
    if (!deleteItem) return;
    if (employeeCount(deleteItem) > 0) {
      setError(t("department_move_users_first").replace("{count}", String(employeeCount(deleteItem))));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/departments/${deleteItem.departmentId}`, { method: "DELETE" });
      setDeleteItem(null);
      loadDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error_deactivate_department"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout role="admin" activePage="admin-departments" onNavigate={onNavigate} pageTitle={t("departments_title")} breadcrumbs={[t("admin"), t("departments_title")]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input
              placeholder={t("departments_search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full ps-8 pe-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
            />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors ms-auto">
            <Plus size={15} /> {t("action_add_department")}
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3, 4].map((n) => <div key={n} className="h-12 rounded-[10px] bg-gray-50 animate-pulse" />)}</div>
        ) : error ? (
          <EmptyState icon={<Building2 size={26} />} title={t("departments_unable_load")} description={error} actionLabel={t("action_try_again")} onAction={loadDepartments} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Building2 size={26} />} title={t("departments_empty_title")} description={t("departments_empty_desc")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("table_department"), t("table_description"), t("table_manager"), t("table_employees"), t("table_created"), t("table_status"), t("table_actions")].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((department) => {
                  const active = department.isActive !== false;
                  const assignedEmployees = employeeCount(department);
                  const canDeactivate = active && assignedEmployees === 0;
                  return (
                    <tr key={department.departmentId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                      <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black whitespace-nowrap">{department.departmentName}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 max-w-[260px] truncate">{department.description || "-"}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{fullName(department.manager)}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{employeeCount(department)}</td>
                      <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{formatDate(department.createdAt)}</td>
                      <td className="py-3 px-3"><Badge label={active ? t("status_active") : t("status_inactive")} variant={statusBadge(active ? "active" : "inactive")} /></td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2">
                          <button onClick={() => openView(department)} className="text-[#089D97] hover:text-[#047975] transition-colors" aria-label={t("aria_view_item").replace("{name}", department.departmentName)}><Eye size={14} /></button>
                          <button onClick={() => openEdit(department)} className="text-blue-400 hover:text-blue-600 transition-colors" aria-label={t("aria_edit_item").replace("{name}", department.departmentName)}><Edit size={14} /></button>
                          <button
                            onClick={() => canDeactivate && setDeleteItem(department)}
                            disabled={!canDeactivate}
                            title={
                              !active
                                ? t("department_already_inactive")
                                : assignedEmployees > 0
                                  ? t("department_move_users_first").replace("{count}", String(assignedEmployees))
                                  : t("aria_deactivate_item").replace("{name}", department.departmentName)
                            }
                            className={`transition-colors ${canDeactivate ? "text-red-400 hover:text-red-600" : "text-gray-300 cursor-not-allowed"}`}
                            aria-label={t("aria_deactivate_item").replace("{name}", department.departmentName)}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{t("departments_count").replace("{count}", String(filtered.length))}</p>
          <Pagination page={page} totalPages={1} onPage={setPage} />
        </div>
      </div>

      <Modal title={t("department_details")} open={!!viewItem} onClose={() => setViewItem(null)} size="md">
        {viewItem && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{viewItem.departmentName}</p>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-black/50">{t("created_on").replace("{date}", formatDate(viewItem.createdAt))}</p>
                </div>
                <Badge label={viewItem.isActive === false ? t("status_inactive") : t("status_active")} variant={statusBadge(viewItem.isActive === false ? "inactive" : "active")} />
              </div>
            </div>
            <div>
              <span className="font-['Poppins',sans-serif] text-[12px] text-black/50 block mb-1">{t("field_description")}</span>
              <p className="font-['Poppins',sans-serif] text-[13px] text-black/70 whitespace-pre-wrap">{viewItem.description || "-"}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <span className="font-['Poppins',sans-serif] text-[12px] text-black/50 block mb-1">{t("field_manager")}</span>
                <p className="font-['Poppins',sans-serif] text-[13px] text-black">{fullName(viewItem.manager)}</p>
              </div>
              <div>
                <span className="font-['Poppins',sans-serif] text-[12px] text-black/50 block mb-1">{t("field_employees")}</span>
                <p className="font-['Poppins',sans-serif] text-[13px] text-black">{employeeCount(viewItem)}</p>
              </div>
            </div>
            {employeeCount(viewItem) > 0 && (
              <p className="font-['Poppins',sans-serif] text-[12px] text-amber-700 bg-amber-50 rounded-[10px] px-3 py-2">
                {t("department_move_users_before_deactivate")}
              </p>
            )}
            <div>
              <span className="font-['Poppins',sans-serif] text-[12px] text-black/50 block mb-2">{t("department_users")}</span>
              {(viewItem.employees ?? []).length === 0 ? (
                <div className="flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] text-black/50"><Users size={14} className="text-[#089D97]" /> {t("no_assigned_employees")}</div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pe-1">
                  {viewItem.employees?.map((employee) => (
                    <div key={employee.employeeId ?? employee.userId} className="flex items-center justify-between gap-3 rounded-[10px] bg-gray-50 px-3 py-2">
                      <span className="font-['Poppins',sans-serif] text-[13px] text-black">{fullName(employee.user)}</span>
                      <span className="font-['Poppins',sans-serif] text-[11px] text-black/45">{employee.user?.role?.roleName ?? t("employee_role_fallback")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal title={editItem ? t("edit_department") : t("action_add_department")} open={addOpen || !!editItem} onClose={closeForm} onConfirm={saveDepartment} confirmLabel={saving ? t("common_saving") : t("action_save")} size="md">
        <div className="space-y-4">
          {formError && <p role="alert" className="whitespace-pre-line text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{formError}</p>}
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("field_department_name")}</label>
            <input
              value={form.departmentName}
              onChange={(event) => setForm((next) => ({ ...next, departmentName: event.target.value }))}
              maxLength={120}
              className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors"
            />
            <p className="mt-1 font-['Poppins',sans-serif] text-[11px] text-black/40">{form.departmentName.length}/120</p>
          </div>
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{t("field_description")}</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((next) => ({ ...next, description: event.target.value }))}
              maxLength={1000}
              rows={5}
              className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors resize-none"
            />
            <p className="mt-1 font-['Poppins',sans-serif] text-[11px] text-black/40">{form.description.length}/1000</p>
          </div>
        </div>
      </Modal>

      <Modal title={t("deactivate_department")} open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={deleteDepartment} confirmLabel={saving ? t("common_deactivating") : t("action_deactivate")} confirmDestructive confirmDisabled={saving || Boolean(deleteItem && employeeCount(deleteItem) > 0)} size="sm">
        <div className="space-y-3">
          <p className="font-['Poppins',sans-serif] text-[14px] text-black">
            {t("confirm_deactivate_department").replace("{department}", deleteItem?.departmentName ?? "")}
          </p>
          {deleteItem && employeeCount(deleteItem) > 0 && (
            <p className="font-['Poppins',sans-serif] text-[12px] text-amber-700 bg-amber-50 rounded-[10px] px-3 py-2">
              {t("department_move_users_first").replace("{count}", String(employeeCount(deleteItem)))}
            </p>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
