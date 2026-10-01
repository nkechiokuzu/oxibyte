import { Capacitor, CapacitorHttp } from '@capacitor/core';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customIp = localStorage.getItem('oxibyte_server_ip');
    if (customIp && (customIp.includes('192.168.10.207') || customIp.includes('192.168.240.207') || customIp.includes('192.168.227.207') || customIp.includes('192.168.173.207'))) {
      localStorage.removeItem('oxibyte_server_ip');
    } else if (customIp) {
      return customIp.startsWith('http') ? customIp : `http://${customIp}:5000/api`;
    }

    // In desktop browser on localhost, always point to local backend
    if (!Capacitor.isNativePlatform() && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000/api';
    }
  }

  // Native Android phone or Wi-Fi client - uses Cloudflare tunnel by default for zero-config global connectivity
  return import.meta.env.VITE_API_URL || 'https://pvc-newton-shop-table.trycloudflare.com/api';
}

const TOKEN_KEY = 'oxibyte_auth_token';

export function setAuthToken(token: string | null | undefined) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

async function apiRequest<T>(options: {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${options.path}`;
  const headers = getHeaders(options.body !== undefined ? { 'Content-Type': 'application/json' } : {});

  try {
    let status: number;
    let data: any;

    if (Capacitor.isNativePlatform()) {
      // Use native Android HTTP layer: completely bypasses WebView CORS, Mixed Content, and PNA restrictions
      const res = await CapacitorHttp.request({
        method: options.method,
        url,
        headers,
        data: options.body,
        connectTimeout: 10000,
        readTimeout: 15000,
      });
      status = res.status;
      data = res.data;
    } else {
      // Browser environment (e.g. localhost:5173 on PC)
      const res = await fetch(url, {
        method: options.method,
        headers,
        credentials: 'include',
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
      status = res.status;
      data = await res.json().catch(() => ({}));
    }

    if (status < 200 || status >= 300) {
      const errorMsg = data?.error || data?.message || `Request failed with status ${status}`;
      throw new ApiError(errorMsg, status);
    }

    if (data && typeof data === 'object' && 'token' in data && typeof data.token === 'string') {
      setAuthToken(data.token);
    }
    if (options.path === '/auth/logout') {
      setAuthToken(null);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    const isNetworkError =
      err?.message?.toLowerCase().includes('failed to fetch') ||
      err?.message?.toLowerCase().includes('network') ||
      err?.message?.toLowerCase().includes('timeout') ||
      err?.name === 'TypeError';
    if (isNetworkError) {
      throw new ApiError(
        `Cannot reach backend server at ${baseUrl}. If you restarted your PC or hotspot, your PC's IP may have changed. Run 'ipconfig' on your PC or tap 'Server: ... (Tap to change)' below.`,
        0
      );
    }
    throw new ApiError(err?.message || 'Network request failed', 0);
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>({ method: 'POST', path, body });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>({ method: 'PATCH', path, body });
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>({ method: 'GET', path });
}
