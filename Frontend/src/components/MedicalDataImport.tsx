import { useState } from "react";
import { apiFetch } from "../lib/api";
import { validateDocumentFile } from "../lib/validation";

export function operationError(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(operationError).join("; ");
  if (value && typeof value === "object") {
    const error = value as { message?: unknown; errors?: { row: number; field?: string; message: string }[] };
    return [error.message ? operationError(error.message) : "", ...(error.errors ?? []).map(e => `Row ${e.row}${e.field ? ` (${e.field})` : ""}: ${e.message}`)].filter(Boolean).join("; ") || "Operation failed.";
  }
  return "Operation failed.";
}

interface ImportResult {
  total: number;
  importedRows: number;
  failed: number;
  partial: number;
  results: { index: number; fileName: string; success: boolean; error?: unknown; summary?: { imported: number; failed: number; errors: { row: number; field?: string; message: string }[] } }[];
}

export default function MedicalDataImport({ petId, onImported, disabled = false, onBusyChange }: { petId: string; onImported: () => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [inputKey, setInputKey] = useState(0);

  async function importFiles() {
    if (busy || !petId || !files.length) return;
    setBusy(true); onBusyChange?.(true); setError(""); setResult(null);
    const body = new FormData();
    files.forEach(file => body.append("files", file));
    try {
      const response = await apiFetch<ImportResult>(`/pets/${petId}/medical-record/import/bulk`, { method: "POST", body });
      setResult(response);
      setFiles([]); setInputKey(key => key + 1);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import medical data.");
    } finally { setBusy(false); onBusyChange?.(false); }
  }

  return <section className="bg-white rounded-[15px] shadow-md p-5 mt-5 space-y-3" aria-label="Import medical data">
    <h2 className="font-semibold text-[16px]">Import medical data</h2>
    <p className="text-sm text-black/60">Choose up to 20 PDFs, each up to 10 MB. Valid records are added to this pet and the source PDFs are attached. Invalid records are reported separately.</p>
    <details className="text-sm">
      <summary className="cursor-pointer text-[#047975]">Required PDF format and example</summary>
      <p className="mt-2">Use a PDF containing selectable text with these labels, one field per line. Separate multiple records with “Record 2”, “Record 3”, and so on. Scanned images are not supported.</p>
      <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 my-2">{"Record 1\nDiagnosis: Routine checkup\nTreatment: No treatment needed\nMedical Date: 2026-09-24\nVaccination Status: PENDING"}</pre>
      <p>Vaccination records can use Vaccine Name, Vaccination Date, and Next Due Date. Dates must use YYYY-MM-DD. Reimporting a successful record creates a duplicate; correct and resubmit only rejected records.</p>
    </details>
    <label className="block text-sm font-medium">Medical PDFs
      <input key={inputKey} type="file" multiple accept="application/pdf,.pdf" disabled={busy || disabled || !petId} className="block w-full min-w-0 mt-2 text-sm" onChange={event => {
        const chosen = Array.from(event.target.files ?? []);
        const validation = chosen.length > 20 ? "Choose no more than 20 PDFs." : chosen.map(file => { const message = validateDocumentFile(file); return message ? `${file.name}: ${message}` : ""; }).filter(Boolean).join("\n");
        setError(validation); setResult(null); setFiles(validation ? [] : chosen);
      }} />
    </label>
    {files.length > 0 && <p className="text-sm">{files.length} PDF(s) selected.</p>}
    <button type="button" disabled={busy || disabled || !petId || files.length === 0} onClick={importFiles} className="rounded-[10px] bg-[#089D97] px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? "Importing…" : "Import selected PDFs"}</button>
    {error && <p role="alert" className="whitespace-pre-wrap text-sm text-red-600">{error}</p>}
    {result && <div role="status" className="space-y-2 text-sm">
      <p>{result.importedRows} record(s) imported. {result.failed} file(s) failed; {result.partial} file(s) partially imported.</p>
      {result.results.map(item => <div key={item.index} className="rounded-lg border p-3 break-words">
        <p className="font-medium">{item.fileName}: {item.summary ? `${item.summary.imported} imported, ${item.summary.failed} rejected` : "Failed"}</p>
        {item.error != null && <p className="text-red-600">{operationError(item.error)}</p>}
        {item.summary?.errors.map((error, index) => <p key={index} className="text-red-600">Row {error.row}{error.field ? ` (${error.field})` : ""}: {error.message}</p>)}
      </div>)}
    </div>}
  </section>;
}
