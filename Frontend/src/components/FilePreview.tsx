import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Eye, FileImage, X } from 'lucide-react';
import { apiBlobFetch } from '../lib/api';
import { getProtectedFilePath, useAuthenticatedFileUrl } from '../lib/fileAccess';
import { useLanguage } from '../context/LanguageContext';

interface PreviewFile { fileName: string; fileUrl: string; mimeType?: string | null }
const previewTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export function FileThumbnail({ file }: { file: PreviewFile }) {
  const url = useAuthenticatedFileUrl(file.fileUrl);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return url && !failed
    ? <img src={url} alt={file.fileName} loading="lazy" onError={() => setFailed(true)} className="w-10 h-10 rounded object-cover" />
    : <FileImage aria-hidden="true" size={20} />;
}

export default function FilePreview({ file }: { file: PreviewFile }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  const [mimeType, setMimeType] = useState('');
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    let objectUrl = '';
    setUrl(''); setError(false);
    const path = getProtectedFilePath(file.fileUrl);
    if (!path) { setError(true); return; }
    apiBlobFetch(path, { signal: controller.signal }).then(blob => {
      if (controller.signal.aborted) return;
      // Never embed HTML or another active format returned by a bad reference.
      if (!previewTypes.includes(blob.type)) throw new Error('Unsupported preview');
      objectUrl = URL.createObjectURL(blob);
      setMimeType(blob.type); setUrl(objectUrl);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [open, file.fileUrl]);
  if (!previewTypes.includes(file.mimeType ?? '')) return null;
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button type="button" aria-label={`${t('files_preview')}: ${file.fileName}`} className="text-primary p-1 hover:bg-gray-100 rounded"><Eye size={16} /></button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
      <Dialog.Content aria-describedby={undefined} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] bg-white rounded-xl shadow-lg p-4 w-[calc(100vw-2rem)] max-w-4xl max-h-[90dvh] overflow-auto">
        <div className="flex items-center justify-between gap-3 mb-3">
          <Dialog.Title className="font-semibold break-all">{file.fileName}</Dialog.Title>
          <Dialog.Close aria-label={t('files_close_preview')} className="shrink-0 p-2"><X size={20} /></Dialog.Close>
        </div>
        {error ? <p role="alert">{t('files_preview_error')}</p> : !url ? <p role="status">{t('files_preview_loading')}</p> : mimeType === 'application/pdf'
          ? <iframe title={file.fileName} src={url} className="w-full h-[65dvh] border-0" />
          : <img src={url} alt={file.fileName} onError={() => setError(true)} className="mx-auto max-h-[65dvh] object-contain" />}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
