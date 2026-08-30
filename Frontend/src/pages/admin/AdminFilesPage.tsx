import { useState, useRef } from "react";
import { Search, Upload, Trash2, Download, FileText, Image, File, FolderOpen } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Modal from "../../components/Modal";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";

interface FileItem {
  id: number; name: string; type: "image" | "pdf" | "doc" | "other"; size: string; uploadedBy: string; uploadedAt: string; category: string;
}

const FILES: FileItem[] = [
  { id: 1, name: "adoption_policy_v2.pdf", type: "pdf", size: "1.2 MB", uploadedBy: "Admin", uploadedAt: "2026-07-01", category: "Policy" },
  { id: 2, name: "pet_intake_form.pdf", type: "pdf", size: "432 KB", uploadedBy: "Sara Khalil", uploadedAt: "2026-06-15", category: "Forms" },
  { id: 3, name: "shelter_banner.png", type: "image", size: "3.1 MB", uploadedBy: "Admin", uploadedAt: "2026-05-20", category: "Media" },
  { id: 4, name: "vaccination_protocol.docx", type: "doc", size: "78 KB", uploadedBy: "Dr. Ahmad", uploadedAt: "2026-07-10", category: "Medical" },
  { id: 5, name: "annual_report_2025.pdf", type: "pdf", size: "5.4 MB", uploadedBy: "Lina Mansour", uploadedAt: "2026-01-30", category: "Reports" },
  { id: 6, name: "volunteer_photo.jpg", type: "image", size: "1.8 MB", uploadedBy: "Admin", uploadedAt: "2026-06-01", category: "Media" },
  { id: 7, name: "supplier_contract.pdf", type: "pdf", size: "620 KB", uploadedBy: "Admin", uploadedAt: "2026-04-12", category: "Contracts" },
  { id: 8, name: "inventory_export.csv", type: "other", size: "48 KB", uploadedBy: "Lina Mansour", uploadedAt: "2026-07-08", category: "Reports" },
];

const categories = ["all", "Policy", "Forms", "Medical", "Reports", "Media", "Contracts"];

function FileIcon({ type }: { type: FileItem["type"] }) {
  if (type === "image") return <Image size={16} className="text-purple-400" />;
  if (type === "pdf") return <FileText size={16} className="text-red-400" />;
  if (type === "doc") return <File size={16} className="text-blue-400" />;
  return <File size={16} className="text-gray-400" />;
}

interface AdminFilesPageProps { onNavigate: (page: string) => void; }

export default function AdminFilesPage({ onNavigate }: AdminFilesPageProps) {
  const [files, setFiles] = useState(FILES);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [deleteItem, setDeleteItem] = useState<FileItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [page, setPage] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = files.filter((f) => {
    const ms = f.name.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === "all" || f.category === catFilter;
    return ms && mc;
  });

  function typeFor(file: File): FileItem["type"] {
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "application/pdf") return "pdf";
    if (file.name.match(/\.(doc|docx)$/i)) return "doc";
    return "other";
  }

  function addFiles(selected: FileList | null) {
    if (!selected?.length) return;
    const next = Array.from(selected).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      type: typeFor(file),
      size: `${Math.max(file.size / 1024, 1).toFixed(0)} KB`,
      uploadedBy: "Admin",
      uploadedAt: new Date().toISOString().slice(0, 10),
      category: "Media",
    }));
    setFiles((current) => [...next, ...current]);
  }

  function downloadFile(file: FileItem) {
    const blob = new Blob([`Mock file download: ${file.name}\nCategory: ${file.category}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout role="admin" activePage="admin-files" onNavigate={onNavigate} pageTitle="File Management" breadcrumbs={["Admin", "Files"]}>
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-[15px] p-8 mb-5 text-center cursor-pointer transition-colors ${dragOver ? "border-[#089D97] bg-[rgba(8,157,151,0.05)]" : "border-gray-200 hover:border-[#089D97] hover:bg-[rgba(8,157,151,0.03)]"}`}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <Upload size={28} className={`mx-auto mb-2 transition-colors ${dragOver ? "text-[#089D97]" : "text-gray-300"}`} />
        <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-black/70">Drag & drop files here, or click to browse</p>
        <p className="font-['Poppins',sans-serif] text-[12px] text-black/40 mt-1">PDF, images, Word documents, CSV — up to 50 MB each</p>
      </div>

      <div className="bg-white rounded-[15px] shadow-md p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${catFilter === c ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{c}</button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto border border-gray-200 rounded-[10px] overflow-hidden">
            {(["list", "grid"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 font-['Poppins',sans-serif] text-[12px] transition-colors ${viewMode === m ? "bg-[#089D97] text-white" : "text-black/60 hover:bg-gray-50"}`}>{m === "list" ? "List" : "Grid"}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<FolderOpen size={28} />} title="No files found" description="Upload files or adjust your search." actionLabel="Upload File" onAction={() => inputRef.current?.click()} />
        ) : viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  {["File", "Category", "Size", "Uploaded by", "Date", "Actions"].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <FileIcon type={f.type} />
                        <span className="font-['Poppins',sans-serif] text-[13px] font-medium text-black">{f.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-[6px] bg-[rgba(8,157,151,0.1)] text-[#047975] font-['Poppins',sans-serif] text-[11px] font-medium">{f.category}</span>
                    </td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/50">{f.size}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{f.uploadedBy}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{f.uploadedAt}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => downloadFile(f)} className="text-[#089D97] hover:text-[#047975] transition-colors"><Download size={14} /></button>
                        <button onClick={() => setDeleteItem(f)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((f) => (
              <div key={f.id} className="border border-gray-100 rounded-[12px] p-4 hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-[10px] bg-gray-50 flex items-center justify-center mb-3">
                  <FileIcon type={f.type} />
                </div>
                <p className="font-['Poppins',sans-serif] font-medium text-[12px] text-black truncate">{f.name}</p>
                <p className="font-['Poppins',sans-serif] text-[11px] text-black/40 mt-0.5">{f.size} · {f.uploadedAt}</p>
                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => downloadFile(f)} className="flex-1 flex items-center justify-center gap-1 py-1 border border-gray-200 rounded-[8px] font-['Poppins',sans-serif] text-[11px] text-[#089D97] hover:bg-[rgba(8,157,151,0.05)]"><Download size={12} /> Download</button>
                  <button onClick={() => setDeleteItem(f)} className="w-7 h-7 flex items-center justify-center border border-red-100 rounded-[8px] text-red-400 hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{filtered.length} files</p>
          <Pagination page={page} totalPages={2} onPage={setPage} />
        </div>
      </div>

      <Modal title="Delete File" open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={() => { setFiles((current) => current.filter((file) => file.id !== deleteItem?.id)); setDeleteItem(null); }} confirmLabel="Delete" confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">Permanently delete <span className="font-semibold">{deleteItem?.name}</span>? This cannot be undone.</p>
      </Modal>
    </DashboardLayout>
  );
}
