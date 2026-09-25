import { useText } from "../../i18n/useText";
import FilePreview, { FileThumbnail } from "../../components/FilePreview";
import { useEffect, useState } from "react";
import { Search, Trash2, Download, FileText, Image, File, FolderOpen, RefreshCw } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";
import Modal from "../../components/Modal";
import BulkDocumentDelete from "../../components/BulkDocumentDelete";
import EmptyState from "../../components/EmptyState";
import Pagination from "../../components/Pagination";
import { useLanguage } from "../../context/LanguageContext";
import { apiFetch } from "../../lib/api";
import { downloadFileUrl } from "../../lib/fileAccess";

interface FileItem {
  canDelete?: boolean;
  fileId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize: number;
  uploadedByName?: string | null;
  uploadedAt: string;
  category: string;
}

const categoryLabels: Record<string, string> = { AVATAR: "Avatar images", PET_IMAGE: "Pet images", SUPPLY_IMAGE: "Supply images", DOCUMENT: "Documents" };

const categories = ["all", "AVATAR", "PET_IMAGE", "SUPPLY_IMAGE", "DOCUMENT"];

function typeFor(file: FileItem): "image" | "pdf" | "other" {
  if (file.mimeType?.startsWith("image/")) return "image";
  if (file.mimeType === "application/pdf") return "pdf";
  return "other";
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(bytes / 1024, 1).toFixed(0)} KB`;
}

function FileIcon({ type }: { type: "image" | "pdf" | "other" }) {
  if (type === "image") return <Image size={16} className="text-purple-400" />;
  if (type === "pdf") return <FileText size={16} className="text-red-400" />;
  return <File size={16} className="text-gray-400" />;
}

interface AdminFilesPageProps { onNavigate: (page: string) => void; }

export default function AdminFilesPage({ onNavigate }: AdminFilesPageProps) {
  const tx = useText();
  const { t } = useLanguage();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [deleteItem, setDeleteItem] = useState<FileItem | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFiles() {
    setLoading(true);
    setError("");
    try {
      setFiles(await apiFetch<FileItem[]>("/files"));
    } catch (err) {
      setError(err instanceof Error ? err.message : tx("Unable to load files."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const filtered = files.filter((f) => {
    const ms = f.fileName.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === "all" || f.category === catFilter;
    return ms && mc;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(page, totalPages);
  const visibleFiles = filtered.slice((currentPage - 1) * 12, currentPage * 12);
  useEffect(() => setPage(1), [search, catFilter]);

  async function downloadFile(file: FileItem) {
    try { await downloadFileUrl(file.fileUrl, file.fileName); }
    catch { setError(t("files_download_error")); }
  }

  async function deleteFile() {
    if (!deleteItem) return;
    try {
      await apiFetch(`/files/${deleteItem.fileId}`, { method: "DELETE" });
      setDeleteItem(null);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : tx("Unable to delete file."));
    }
  }

  return (
    <DashboardLayout role="admin" activePage="admin-files" onNavigate={onNavigate} pageTitle={t("admin_file_mgmt")} breadcrumbs={[t("role_admin"), t("nav_files")]}>
      <div className="bg-white rounded-[15px] shadow-md p-5">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-5 items-center">
          <div className="flex-1 min-w-[180px] relative">
            <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[#089D97]" />
            <input placeholder={t("admin_search_files")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full ps-8 pe-3 py-2 border border-gray-200 rounded-[10px] font-['Poppins',sans-serif] text-[13px] outline-none focus:border-[#089D97] transition-colors" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-[20px] font-['Poppins',sans-serif] text-[12px] capitalize transition-colors ${catFilter === c ? "bg-[#089D97] text-white" : "bg-gray-100 text-black/70 hover:bg-gray-200"}`}>{c === "all" ? t("status_all") : tx(categoryLabels[c] ?? c)}</button>
            ))}
          </div>
          <button onClick={loadFiles} className="text-[#089D97] hover:text-[#047975] transition-colors" aria-label={tx("Refresh files")}><RefreshCw size={16} /></button>
          <div className="flex gap-1 ms-auto border border-gray-200 rounded-[10px] overflow-hidden">
            {(["list", "grid"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1.5 font-['Poppins',sans-serif] text-[12px] transition-colors ${viewMode === m ? "bg-[#089D97] text-white" : "text-black/60 hover:bg-gray-50"}`}>{m === "list" ? t("misc_list") : t("misc_grid")}</button>
            ))}
          </div>
        </div>

        <div className="mb-4"><BulkDocumentDelete documents={filtered.filter(file => file.category === "DOCUMENT")} onDeleted={loadFiles} disabled={loading} /></div>
        {error && <p className="mb-4 text-[13px] text-red-600 bg-red-50 rounded-[10px] px-3 py-2">{error}</p>}
        {loading ? (
          <div className="h-[180px] rounded-[12px] bg-gray-50 animate-pulse" />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<FolderOpen size={28} />} title={t("files_empty_title")} description={t("files_empty_desc")} />
        ) : viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-gray-100">
                  {[t("th_file"), t("th_category"), t("th_size"), t("th_uploaded_by"), t("th_date"), t("th_actions")].map((h) => (
                    <th key={h} className="py-2.5 px-3 font-['Poppins',sans-serif] font-semibold text-[11px] text-black/50 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleFiles.map((f) => (
                  <tr key={f.fileId} className="border-b border-gray-50 hover:bg-[rgba(8,157,151,0.03)] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {typeFor(f) === "image" ? <FileThumbnail file={f} /> : <FileIcon type={typeFor(f)} />}
                        <span className="font-['Poppins',sans-serif] text-[13px] font-medium text-black">{f.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-[6px] bg-[rgba(8,157,151,0.1)] text-[#047975] font-['Poppins',sans-serif] text-[11px] font-medium">{tx(categoryLabels[f.category] ?? f.category)}</span>
                    </td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/50">{formatSize(f.fileSize)}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{f.uploadedByName ?? "-"}</td>
                    <td className="py-3 px-3 font-['Poppins',sans-serif] text-[12px] text-black/60">{f.uploadedAt?.slice(0, 10)}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button aria-label={`${t("action_download")}: ${f.fileName}`} onClick={() => downloadFile(f)} className="text-[#089D97] hover:text-[#047975] transition-colors"><Download size={14} /></button>
                        <FilePreview file={f} />
                        <button disabled={f.canDelete === false} aria-label={`${t("action_delete")}: ${f.fileName}`} onClick={() => setDeleteItem(f)} className="text-red-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleFiles.map((f) => (
              <div key={f.fileId} className="border border-gray-100 rounded-[12px] p-4 hover:shadow-md transition-shadow group">
                <div className="w-10 h-10 rounded-[10px] bg-gray-50 flex items-center justify-center mb-3">
                  {typeFor(f) === "image" ? <FileThumbnail file={f} /> : <FileIcon type={typeFor(f)} />}
                </div>
                <p className="font-['Poppins',sans-serif] font-medium text-[12px] text-black truncate">{f.fileName}</p>
                <p className="font-['Poppins',sans-serif] text-[11px] text-black/40 mt-0.5">{formatSize(f.fileSize)} · {f.uploadedAt?.slice(0, 10)}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button aria-label={`${t("action_download")}: ${f.fileName}`} onClick={() => downloadFile(f)} className="flex-1 flex items-center justify-center gap-1 py-1 border border-gray-200 rounded-[8px] font-['Poppins',sans-serif] text-[11px] text-[#089D97] hover:bg-[rgba(8,157,151,0.05)]"><Download size={12} /> {t("action_download")}</button>
                  <FilePreview file={f} />
                        <button disabled={f.canDelete === false} aria-label={`${t("action_delete")}: ${f.fileName}`} onClick={() => setDeleteItem(f)} className="w-7 h-7 flex items-center justify-center border border-red-100 rounded-[8px] text-red-400 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <p className="font-['Poppins',sans-serif] text-[12px] text-black/40">{t("files_count").replace("{count}", String(filtered.length))}</p>
          <Pagination page={currentPage} totalPages={totalPages} onPage={setPage} />
        </div>
      </div>

      <Modal title={t("files_delete_title")} open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={deleteFile} confirmLabel={t("action_delete")} confirmDestructive size="sm">
        <p className="font-['Poppins',sans-serif] text-[14px] text-black">{t("files_delete_confirm").replace("{name}", deleteItem?.fileName ?? "")}</p>
      </Modal>
    </DashboardLayout>
  );
}
