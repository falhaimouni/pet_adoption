import { useState } from "react";
import { Search, Plus, Edit, Trash2, Phone, Mail, MapPin, Eye } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";

interface Supplier {
  id: number; name: string; contact: string; phone: string; email: string; city: string; categories: string[]; status: string; lastOrder: string; totalOrders: number;
}

const SUPPLIERS: Supplier[] = [
  { id: 1, name: "PetCo Jordan", contact: "Ahmad Haddad", phone: "+962-6-5001234", email: "orders@petcojordan.com", city: "Amman", categories: ["Food", "Grooming"], status: "active", lastOrder: "2026-07-10", totalOrders: 28 },
  { id: 2, name: "VetPharma", contact: "Dr. Sana Khalil", phone: "+962-6-5229876", email: "supply@vetpharma.jo", city: "Amman", categories: ["Medical"], status: "active", lastOrder: "2026-06-28", totalOrders: 14 },
  { id: 3, name: "Animal Care Co.", contact: "Rami Saleh", phone: "+962-6-5314455", email: "info@animalcare.jo", city: "Zarqa", categories: ["Hygiene", "Food"], status: "active", lastOrder: "2026-07-01", totalOrders: 9 },
  { id: 4, name: "HealthPet", contact: "Lara Mansour", phone: "+962-6-4890011", email: "sales@healthpet.com", city: "Irbid", categories: ["Medical", "Food"], status: "inactive", lastOrder: "2025-12-15", totalOrders: 5 },
  { id: 5, name: "NaturePet", contact: "Omar Jamil", phone: "+962-6-5770022", email: "contact@naturepet.jo", city: "Aqaba", categories: ["Food"], status: "active", lastOrder: "2026-07-05", totalOrders: 7 },
];

const catOptions = ["Food", "Medical", "Hygiene", "Grooming"];
const emptyForm = { name: "", contact: "", phone: "", email: "", city: "", categories: [] as string[], status: "active" };

interface AdminSuppliersPageProps { onNavigate: (page: string) => void; }

export default function AdminSuppliersPage({ onNavigate }: AdminSuppliersPageProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewItem, setViewItem] = useState<Supplier | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<Supplier | null>(null);
  const [deleteItem, setDeleteItem] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [page, setPage] = useState(1);

  const filtered = SUPPLIERS.filter((s) => {
    const ms = s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === "all" || s.status === statusFilter;
    return ms && mst;
  });

  function openAdd() { setForm(emptyForm); setAddOpen(true); }
  function openEdit(s: Supplier) { setForm({ name: s.name, contact: s.contact, phone: s.phone, email: s.email, city: s.city, categories: [...s.categories], status: s.status }); setEditItem(s); }

  return (
    <DashboardLayout role="admin" activePage="admin-suppliers" onNavigate={onNavigate} pageTitle="Suppliers" breadcrumbs={["Admin", "Suppliers"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder="Search by name or city..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${statusFilter === s ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{s}</button>
            ))}
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors ml-auto">
            <Plus size={15} /> Add Supplier
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {["Supplier", "Contact", "City", "Categories", "Orders", "Last Order", "Status", "Actions"].map((h) => (
                  <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                  <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black whitespace-nowrap">{s.name}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{s.contact}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60 whitespace-nowrap">{s.city}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1 flex-wrap">
                      {s.categories.map((c) => (
                        <span key={c} className="px-2 py-0.5 rounded-[6px] bg-[rgba(8,157,151,0.1)] text-[#047975] font-['Poppins',sans-serif] text-[10px] font-medium">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[13px] font-semibold text-black">{s.totalOrders}</td>
                  <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{s.lastOrder}</td>
                  <td className="py-3 px-3"><Badge label={s.status} variant={statusBadge(s.status)} /></td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button onClick={() => setViewItem(s)} className="text-[#089D97] hover:text-[#047975] transition-colors"><Eye size={14} /></button>
                      <button onClick={() => openEdit(s)} className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                      <button onClick={() => setDeleteItem(s)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{filtered.length} suppliers</p>
          <Pagination page={page} totalPages={2} onPage={setPage} />
        </div>
      </div>

      {/* View details */}
      <Modal title="Supplier Details" open={!!viewItem} onClose={() => setViewItem(null)} size="sm">
        {viewItem && (
          <div className="space-y-3">
            <div className="pb-3 border-b border-gray-100">
              <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">{viewItem.name}</p>
              <Badge label={viewItem.status} variant={statusBadge(viewItem.status)} />
            </div>
            <div className="flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] text-black/60"><Phone size={13} className="text-[#089D97]" /> {viewItem.phone}</div>
            <div className="flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] text-black/60"><Mail size={13} className="text-[#089D97]" /> {viewItem.email}</div>
            <div className="flex items-center gap-2 text-[13px] font-['Poppins',sans-serif] text-black/60"><MapPin size={13} className="text-[#089D97]" /> {viewItem.city}</div>
            <div className="pt-2 border-t border-gray-100 flex justify-between">
              <span className="font-['Poppins',sans-serif] text-[12px] text-black/50">Total Orders</span>
              <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black">{viewItem.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-['Poppins',sans-serif] text-[12px] text-black/50">Last Order</span>
              <span className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black">{viewItem.lastOrder}</span>
            </div>
            <div>
              <span className="font-['Poppins',sans-serif] text-[12px] text-black/50 block mb-1">Supplies</span>
              <div className="flex gap-1 flex-wrap">
                {viewItem.categories.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded-[6px] bg-[rgba(8,157,151,0.1)] text-[#047975] font-['Poppins',sans-serif] text-[11px] font-medium">{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit */}
      <Modal title={editItem ? "Edit Supplier" : "Add Supplier"} open={addOpen || !!editItem} onClose={() => { setAddOpen(false); setEditItem(null); }} onConfirm={() => { setAddOpen(false); setEditItem(null); }} confirmLabel="Save" size="md">
        <div className="grid grid-cols-2 gap-4">
          {[{ label: "Company Name", field: "name" as const, span: 2 }, { label: "Contact Person", field: "contact" as const, span: 1 }, { label: "City", field: "city" as const, span: 1 }, { label: "Phone", field: "phone" as const, span: 1 }, { label: "Email", field: "email" as const, span: 1 }].map(({ label, field, span }) => (
            <div key={field} className={span === 2 ? "col-span-2" : ""}>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
              <input value={form[field] as string} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
            </div>
          ))}
          <div>
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] bg-white outline-none focus:border-[#089D97] transition-colors">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-2">Supply Categories</label>
            <div className="flex gap-2 flex-wrap">
              {catOptions.map((c) => {
                const checked = form.categories.includes(c);
                return (
                  <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, categories: checked ? f.categories.filter((x) => x !== c) : [...f.categories, c] }))} className={`px-3 py-1 rounded-[20px] font-['Poppins',sans-serif] text-[12px] border transition-colors ${checked ? "bg-[#089D97] text-white border-[#089D97]" : "bg-white text-black/60 border-gray-200 hover:border-[#089D97]"}`}>{c}</button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete */}
      <Modal title="Delete Supplier" open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={() => setDeleteItem(null)} confirmLabel="Delete" confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Remove <span className="font-semibold">{deleteItem?.name}</span> from your supplier list?</p>
      </Modal>
    </DashboardLayout>
  );
}
