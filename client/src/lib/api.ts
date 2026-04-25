const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;

export const apiFetch = (path: string, init?: RequestInit) => fetch(apiUrl(path), init);
