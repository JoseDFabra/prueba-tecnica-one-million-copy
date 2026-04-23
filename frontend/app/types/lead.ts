export type LeadSource = 'instagram' | 'facebook' | 'landing_page' | 'referido' | 'otro';

export interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  fuente: LeadSource;
  producto_interes?: string;
  presupuesto?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadsResponse {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadStats {
  total: number;
  bySource: { fuente: LeadSource; count: number }[];
  avgBudget: number;
  last7Days: number;
}

export interface LeadFilters {
  search?: string;
  fuente?: LeadSource;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export const SOURCE_LABELS: Record<LeadSource, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  landing_page: 'Landing Page',
  referido: 'Referido',
  otro: 'Otro',
};

export const SOURCE_OPTIONS = (Object.keys(SOURCE_LABELS) as LeadSource[]).map((key) => ({
  label: SOURCE_LABELS[key],
  value: key,
}));
