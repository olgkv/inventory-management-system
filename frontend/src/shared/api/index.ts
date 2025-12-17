const DEFAULT_API_URL = 'http://localhost:3001';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;

export { ApiError } from './api-error';
export { fetchJson, fetchVoid } from './fetch';

export function joinApiUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
