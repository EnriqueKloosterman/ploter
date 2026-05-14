const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'plotweaver_token';

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export interface ApiAdapters {
  fetch: typeof globalThis.fetch;
  getToken: () => string | null;
  setToken: (token: string | null) => void;
  redirect: (url: string) => void;
}

const defaultAdapters: ApiAdapters = {
  fetch: globalThis.fetch.bind(globalThis),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  redirect: (url) => { window.location.href = url; },
};

let adapters: ApiAdapters = defaultAdapters;

export const setApiAdapters = (overrides: Partial<ApiAdapters>) => {
  adapters = { ...adapters, ...overrides };
};

export const resetApiAdapters = () => {
  adapters = defaultAdapters;
};

export const apiFetch = (path: string, init?: RequestInit) => {
  const token = adapters.getToken();
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return adapters.fetch(apiUrl(path), { ...init, headers }).then((res) => {
    if (res.status === 401 && token) {
      adapters.setToken(null);
      adapters.redirect('/login');
    }
    return res;
  });
};
