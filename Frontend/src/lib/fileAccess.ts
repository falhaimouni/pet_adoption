import { useEffect, useState } from "react";
import { apiBlobFetch, API_BASE_URL, resolveAssetUrl } from "./api";

export function getProtectedFilePath(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("/files/") || /^\/community\/messages\/[^/]+\/image$/.test(url)) return url;

  try {
    const parsed = new URL(url);
    const apiBase = new URL(API_BASE_URL);
    if (parsed.origin === apiBase.origin && parsed.pathname.startsWith("/files/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return "";
  }

  return "";
}

export function isProtectedFileUrl(url?: string | null) {
  return Boolean(getProtectedFilePath(url));
}

export function useAuthenticatedFileUrl(url?: string | null) {
  const [objectUrl, setObjectUrl] = useState("");
  const protectedPath = getProtectedFilePath(url);
  const publicUrl = protectedPath ? "" : resolveAssetUrl(url);

  useEffect(() => {
    if (!protectedPath) {
      setObjectUrl("");
      return;
    }

    let cancelled = false;
    let nextObjectUrl = "";

    apiBlobFetch(protectedPath)
      .then((blob) => {
        if (cancelled) return;
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        if (!cancelled) setObjectUrl("");
      });

    return () => {
      cancelled = true;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [protectedPath]);

  return protectedPath ? objectUrl : publicUrl;
}

export async function downloadFileUrl(url: string, fileName: string) {
  const protectedPath = getProtectedFilePath(url);
  const href = protectedPath
    ? URL.createObjectURL(await apiBlobFetch(protectedPath))
    : resolveAssetUrl(url);

  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  if (protectedPath) URL.revokeObjectURL(href);
}
