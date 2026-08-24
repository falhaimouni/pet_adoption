import { useState } from "react";
import { Search, Plus, Edit, Trash2, AlertTriangle, Package } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Badge, { statusBadge } from "../../components/Badge";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import EmptyState from "../../components/EmptyState";

interface Item {
  id: number; name: string; category: string; qty: number; minQty: number; supplier: string; expiry: string; status: string;
}

const ITEMS: Item[] = [
  { id: 1, name: "Dog Food (Premium)", category: "Food", qty: 8, minQty: 20, supplier: "PetCo Jordan", expiry: "2027-01-01", status: "low stock" },
  { id: 2, name: "Cat Litter (10kg)", category: "Hygiene", qty: 5, minQty: 15, supplier: "Animal Care Co.", expiry: "2028-06-01", status: "low stock" },
  { id: 3, name: "Flea Treatment", category: "Medical", qty: 3, minQty: 10, supplier: "VetPharma", expiry: "2026-09-01", status: "out of stock" },
  { id: 4, name: "Dog Shampoo", category: "Grooming", qty: 22, minQty: 10, supplier: "PetCo Jordan", expiry: "2027-08-15", status: "in stock" },
  { id: 5, name: "Antibiotic Drops", category: "Medical", qty: 14, minQty: 5, supplier: "VetPharma", expiry: "2026-12-01", status: "in stock" },
  { id: 6, name: "Pet Vitamins", category: "Medical", qty: 30, minQty: 10, supplier: "HealthPet", expiry: "2027-03-01", status: "in stock" },
];

const categories = ["all", "Food", "Medical", "Hygiene", "Grooming"];

interface ManagerInventoryPageProps { onNavigate: (page: string) => void; }

export default function ManagerInventoryPage({ onNavigate }: ManagerInventoryPageProps) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<Item | null>(null);
  const [deleteItem, setDeleteItem] = useState<Item | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ name: "", category: "Food", qty: "", minQty: "", supplier: "", expiry: "" });

  const filtered = ITEMS.filter((i) => {
    const ms = i.name.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === "all" || i.category === catFilter;
    return ms && mc;
  });

  return (
    <DashboardLayout role="manager" activePage="manager-inventory" onNavigate={onNavigate} pageTitle="Inventory" breadcrumbs={["Manager", "Inventory"]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${catFilter === c ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{c}</button>
            ))}
          </div>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#089D97] text-white font-['Poppins',sans-serif] font-medium text-[13px] rounded-[10px] hover:bg-[#047975] transition-colors ml-auto">
            <Plus size={16} /> Add Item
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<Package size={28} />} title="No items found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Name", "Category", "Qty", "Min", "Supplier", "Expiry", "Status", "Actions"].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className={`border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors ${item.qty <= item.minQty ? "bg-yellow-50/50" : ""}`}>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-black">
                      {item.qty <= 0 && <AlertTriangle size={13} className="text-red-400 inline mr-1" />}
                      {item.qty <= item.minQty && item.qty > 0 && <AlertTriangle size={13} className="text-yellow-400 inline mr-1" />}
                      {item.name}
                    </td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{item.category}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] font-semibold text-[13px] text-black">{item.qty}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{item.minQty}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{item.supplier}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{item.expiry}</td>
                    <td className="py-3 px-3"><Badge label={item.status} variant={statusBadge(item.status)} /></td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setAdjustItem(item); setAdjustQty(item.qty); }} className="font-['Poppins',sans-serif] text-[11px] text-[#089D97] hover:underline whitespace-nowrap">Adjust</button>
                        <button className="text-blue-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                        <button onClick={() => setDeleteItem(item)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={3} onPage={setPage} />
      </div>

      {/* Add modal */}
      <Modal title="Add Inventory Item" open={addOpen} onClose={() => setAddOpen(false)} onConfirm={() => setAddOpen(false)} confirmLabel="Add Item" size="md">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">Item Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Dog Food (Premium)" className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          {[{ label: "Category", field: "category", type: "select", options: ["Food", "Medical", "Hygiene", "Grooming"] },
            { label: "Supplier", field: "supplier", type: "text" },
            { label: "Quantity", field: "qty", type: "number" },
            { label: "Min Quantity", field: "minQty", type: "number" },
            { label: "Expiry Date", field: "expiry", type: "date" },
          ].map(({ label, field, type, options }) => (
            <div key={field}>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">{label}</label>
              {type === "select" ? (
                <select value={(form as any)[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] bg-white transition-colors">
                  {options?.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={type} value={(form as any)[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Stock adjust modal */}
      <Modal title="Adjust Stock" open={!!adjustItem} onClose={() => setAdjustItem(null)} onConfirm={() => setAdjustItem(null)} confirmLabel="Update" size="sm">
        {adjustItem && (
          <div className="space-y-3">
            <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-black">{adjustItem.name}</p>
            <div>
              <label className="block font-['Poppins',sans-serif] text-[12px] text-black/60 mb-1">New Quantity</label>
              <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(Number(e.target.value))} className="w-full border border-gray-200 rounded-[10px] px-3 py-2 font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal title="Delete Item" open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={() => setDeleteItem(null)} confirmLabel="Delete" confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Remove <span className="font-semibold">{deleteItem?.name}</span> from inventory?</p>
      </Modal>
    </DashboardLayout>
  );
}
