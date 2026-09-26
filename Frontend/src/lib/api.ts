import { localizeApiMessage } from "../i18n/text";
import { MOCK_API_ENABLED, mockApiBlobFetch, mockApiFetch } from "./mockApi";
import { uploadRequest } from "./uploadTransport";
import { validateRequest } from "./formValidation";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const ACCESS_TOKEN_KEY = "petopia_access_token";
const REFRESH_TOKEN_KEY = "petopia_refresh_token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(localizeApiMessage(message, status));
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? "";
}

export function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) ?? "";
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  clearAuthTokens();
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function updateStoredTokens(accessToken: string, refreshToken: string) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function resolveAssetUrl(url?: string | null) {
  if (!url) return "";
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (url.startsWith("/assets/")) return url;
  if (MOCK_API_ENABLED && !url.startsWith("/uploads/")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export interface PetImageResponse {
  imageId: string;
  fileId: string;
  imageUrl: string;
  uploadedAt: string;
}

export interface PetResponse {
  petId: string;
  name: string;
  species: string;
  breed?: string | null;
  age?: number | null;
  gender?: string | null;
  color?: string | null;
  weight?: number | null;
  description?: string | null;
  healthStatus?: string | null;
  adoptionStatus: string;
  arrivalDate?: string | null;
  images: PetImageResponse[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.accessToken || !data?.refreshToken) {
          clearAuthTokens();
          return null;
        }
        updateStoredTokens(data.accessToken, data.refreshToken);
        return data.accessToken as string;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function parseResponse(res: Response) {
  const contentType = res.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

async function realApiFetch<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {

  const headers = new Headers(init.headers);
  const token = getAccessToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = init.body instanceof FormData
    ? await uploadRequest(`${API_BASE_URL}${path}`, { ...init, headers, body: init.body })
    : await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const data = await parseResponse(res);

  if (res.status === 401 && allowRefresh && path !== "/auth/refresh") {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${nextToken}`);
      if (init.body && !(init.body instanceof FormData) && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      return apiFetch<T>(path, { ...init, headers: retryHeaders }, false);
    }
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? Array.isArray(data.message) ? data.message.join(", ") : String(data.message)
        : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  validateRequest(path, init, MOCK_API_ENABLED);
  if (MOCK_API_ENABLED) return mockApiFetch<T>(path, init);
  return realApiFetch<T>(path, init, allowRefresh);
}

export async function apiFetchReal<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  validateRequest(path, init);
  return realApiFetch<T>(path, init, allowRefresh);
}

export async function apiBlobFetch(path: string, init: RequestInit = {}, allowRefresh = true): Promise<Blob> {
  validateRequest(path, init, MOCK_API_ENABLED);
  if (MOCK_API_ENABLED) return mockApiBlobFetch(path);

  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (res.status === 401 && allowRefresh) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Authorization", `Bearer ${nextToken}`);
      return apiBlobFetch(path, { ...init, headers: retryHeaders }, false);
    }
  }

  if (!res.ok) {
    const data = await parseResponse(res).catch(() => null);
    const message =
      typeof data === "object" && data && "message" in data
        ? Array.isArray(data.message) ? data.message.join(", ") : String(data.message)
        : `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return res.blob();
}
