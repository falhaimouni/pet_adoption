// The snapshot store keeps concurrent uploads visible even when a route changes.
export interface UploadState { id: number; name: string; percent?: number; processing: boolean }
let nextId = 0;
let uploads: UploadState[] = [];
const listeners = new Set<() => void>();
export const getUploads = () => uploads;
export function subscribeUploads(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function publish() { listeners.forEach(listener => listener()); }

export function uploadRequest(url: string, init: RequestInit & { body: FormData }): Promise<Response> {
  const id = ++nextId;
  const name = Array.from(init.body.values()).filter((value): value is File => value instanceof File).map(file => file.name).join(', ');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const cleanup = () => {
      init.signal?.removeEventListener('abort', abort);
      uploads = uploads.filter(upload => upload.id !== id);
      publish();
    };
    const abort = () => xhr.abort();
    const update = (values: Partial<UploadState>) => {
      uploads = uploads.map(upload => upload.id === id ? { ...upload, ...values } : upload);
      publish();
    };
    if (init.signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    xhr.open(init.method ?? 'POST', url);
    xhr.withCredentials = init.credentials === 'include';
    new Headers(init.headers).forEach((value, key) => xhr.setRequestHeader(key, value));
    xhr.upload.onprogress = event => update({ percent: event.lengthComputable ? Math.round(event.loaded / event.total * 100) : undefined });
    xhr.upload.onload = () => update({ percent: 100, processing: true });
    xhr.onload = () => {
      cleanup();
      const headers = new Headers();
      xhr.getAllResponseHeaders().trim().split(/[\r\n]+/).filter(Boolean).forEach(line => {
        const index = line.indexOf(':');
        if (index > 0) headers.append(line.slice(0, index), line.slice(index + 1).trim());
      });
      resolve(new Response([204, 205, 304].includes(xhr.status) ? null : xhr.responseText, { status: xhr.status, headers }));
    };
    xhr.onerror = () => { cleanup(); reject(new TypeError('Upload failed. Check your connection and try again.')); };
    xhr.onabort = () => { cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
    init.signal?.addEventListener('abort', abort, { once: true });
    uploads = [...uploads, { id, name, percent: 0, processing: false }];
    publish();
    try { xhr.send(init.body); } catch (error) { cleanup(); reject(error); }
  });
}
