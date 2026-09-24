import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import Modal from "./Modal";
import { operationError } from "./MedicalDataImport";

interface Document { fileId: string; fileName: string; mimeType?: string | null; }
interface DeleteResult { deleted: number; failed: number; results: { fileId: string; success: boolean; error?: unknown }[]; }

export default function BulkDocumentDelete({ documents, onDeleted, disabled = false, onBusyChange }: { documents: Document[]; onDeleted: () => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DeleteResult | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const eligible = documents.filter(doc => doc.mimeType === "application/pdf");
  useEffect(() => { setSelected(ids => ids.filter(id => documents.some(doc => doc.fileId === id))); }, [documents]);

  async function remove() {
    if (busy || !selected.length) return;
    setBusy(true); onBusyChange?.(true); setError(""); setResult(null);
    setNames(Object.fromEntries(eligible.map(doc => [doc.fileId, doc.fileName])));
    try {
      const response = await apiFetch<DeleteResult>("/files/documents/bulk", { method: "DELETE", body: JSON.stringify({ fileIds: selected }) });
      setResult(response);
      setSelected(response.results.filter(item => !item.success).map(item => item.fileId));
      setConfirm(false);
      onDeleted();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to delete documents."); }
    finally { setBusy(false); onBusyChange?.(false); }
  }

  return <>
    <button type="button" disabled={disabled || eligible.length === 0} onClick={() => { setOpen(true); setConfirm(false); setError(""); setResult(null); }} className="rounded-[10px] border border-red-200 px-3 py-2 text-sm text-red-600 disabled:opacity-50">Delete multiple PDFs</button>
    <Modal title="Delete PDF documents" open={open} onClose={() => { if (!busy) setOpen(false); }} onConfirm={confirm ? remove : () => setConfirm(true)} confirmDisabled={busy || !selected.length} confirmLabel={busy ? "Deleting…" : confirm ? "Delete selected PDFs" : "Review deletion"} confirmDestructive={confirm}>
      <p className="text-sm mb-3">Select up to 20 PDFs. Deletion permanently removes the selected attachments. Medical entries and vaccinations are kept.</p>
      {!confirm ? <div className="space-y-2">
        <button type="button" className="text-sm text-[#047975]" onClick={() => setSelected(eligible.slice(0, 20).map(doc => doc.fileId))}>Select first {Math.min(eligible.length, 20)} PDFs</button>
        <button type="button" className="text-sm ms-3" onClick={() => setSelected([])}>Clear selection</button>
        {eligible.map(doc => <label key={doc.fileId} className="flex gap-2 items-start text-sm break-all">
          <input type="checkbox" checked={selected.includes(doc.fileId)} disabled={busy || (!selected.includes(doc.fileId) && selected.length >= 20)} onChange={event => setSelected(ids => event.target.checked ? [...ids, doc.fileId] : ids.filter(id => id !== doc.fileId))} />
          {doc.fileName}
        </label>)}
        <p className="text-sm">{selected.length} / 20 selected</p>
      </div> : <div className="text-sm space-y-2">
        <p className="font-semibold">Permanently delete {selected.length} PDF(s)?</p>
        <ul className="list-disc ps-5 break-all">{eligible.filter(doc => selected.includes(doc.fileId)).map(doc => <li key={doc.fileId}>{doc.fileName}</li>)}</ul>
        <button disabled={busy} onClick={() => setConfirm(false)} className="text-[#047975]">Back to selection</button>
      </div>}
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {result && <div role="status" className="mt-3 text-sm space-y-2"><p>{result.deleted} deleted; {result.failed} failed.</p>{result.results.filter(item => !item.success).map(item => <p key={item.fileId} className="text-red-600 break-words">{names[item.fileId] ?? item.fileId}: {operationError(item.error)}</p>)}</div>}
    </Modal>
  </>;
}
