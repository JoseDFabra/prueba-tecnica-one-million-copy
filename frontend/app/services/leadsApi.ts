import { Lead, LeadFilters, LeadsResponse, LeadStats } from '../types/lead';

function resolveBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();

  if (configured) {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const isPublicHost = hostname !== 'localhost' && hostname !== '127.0.0.1';
      const pointsToLocalhost = configured.includes('localhost') || configured.includes('127.0.0.1');
      const shouldForcePublicHost = appEnv === 'prod' || appEnv === 'production';

      // If the bundle was built with localhost but user opens app via public IP/domain,
      // switch to current host so API requests don't target the visitor's own machine.
      if ((pointsToLocalhost && isPublicHost) || shouldForcePublicHost) {
        return `${window.location.protocol}//${hostname}:3001/api`;
      }
    }

    return configured;
  }

  // Fallback runtime for deployed environments without build arg:
  // use current host and point to backend port 3001.
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001/api`;
  }

  return 'http://localhost:3001/api';
}

const BASE = resolveBaseUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Error ${res.status}`);
  }
  return res.json();
}

function buildQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.fuente) params.set('fuente', filters.fuente);
  if (filters.fechaDesde) params.set('fechaDesde', filters.fechaDesde);
  if (filters.fechaHasta) params.set('fechaHasta', filters.fechaHasta);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  return params.toString() ? `?${params.toString()}` : '';
}

export const leadsApi = {
  getAll: (filters: LeadFilters = {}) =>
    request<LeadsResponse>(`/leads${buildQuery(filters)}`),

  getOne: (id: string) =>
    request<Lead>(`/leads/${id}`),

  getStats: () =>
    request<LeadStats>('/leads/stats'),

  create: (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<Lead>('/leads', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>>) =>
    request<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<Lead>(`/leads/${id}`, { method: 'DELETE' }),
};
