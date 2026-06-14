// ── Central API base URL ──────────────────────────────────────────
// In development: Vite proxy forwards /api → localhost:3001
// In production (Vercel/Netlify): set VITE_API_URL to your Railway backend URL
export const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
