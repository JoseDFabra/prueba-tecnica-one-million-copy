'use client';
import { Tag } from 'primereact/tag';
import { LeadSource, SOURCE_LABELS } from '../../types/lead';

const SEVERITY: Record<LeadSource, 'info' | 'success' | 'warning' | 'danger' | undefined> = {
  instagram: 'warning',
  facebook: 'info',
  landing_page: 'success',
  referido: undefined,
  otro: 'danger',
};

export default function SourceBadge({ source }: { source: LeadSource }) {
  return <Tag value={SOURCE_LABELS[source]} severity={SEVERITY[source]} />;
}
