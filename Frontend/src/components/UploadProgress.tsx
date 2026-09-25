import { useSyncExternalStore } from 'react';
import { getUploads, subscribeUploads } from '../lib/uploadTransport';
import { useLanguage } from '../context/LanguageContext';

export default function UploadProgress() {
  const uploads = useSyncExternalStore(subscribeUploads, getUploads);
  const { t } = useLanguage();
  if (!uploads.length) return null;
  return <aside aria-label={t('files_upload_progress')} className="fixed bottom-4 end-4 z-[100] w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white border shadow-lg p-4 space-y-3">
    {uploads.map(upload => <div key={upload.id}>
      <p className="text-sm font-medium truncate" title={upload.name}>{upload.name}</p>
      <p role="status" className="text-sm text-gray-600">{upload.processing ? t('files_processing') : t('files_uploading')}</p>
      <div className="flex items-center gap-2">
        <progress aria-label={`${t('files_upload_progress')}: ${upload.name}`} max={100} value={upload.percent} className="w-full accent-primary" />
        {upload.percent !== undefined && <span className="text-xs">{upload.percent}%</span>}
      </div>
    </div>)}
  </aside>;
}
