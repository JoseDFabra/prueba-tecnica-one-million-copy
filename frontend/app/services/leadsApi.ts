import { Lead, LeadFilters, LeadsResponse, LeadStats } from '../types/lead';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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
