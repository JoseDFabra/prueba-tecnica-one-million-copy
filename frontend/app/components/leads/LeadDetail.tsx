'use client';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Lead, SOURCE_LABELS } from '../../types/lead';
import SourceBadge from './SourceBadge';

interface LeadDetailProps {
  lead: Lead;
  onEdit: () => void;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-3">
      <span className="text-500 text-sm block mb-1">{label}</span>
      <span className="text-900 font-medium">{value ?? <span className="text-400">—</span>}</span>
    </div>
  );
}

export default function LeadDetail({ lead, onEdit }: LeadDetailProps) {
  const createdAt = new Date(lead.createdAt).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="flex flex-column h-full">
      <div className="flex align-items-center gap-3 mb-4">
        <div
          className="flex align-items-center justify-content-center border-circle bg-primary"
          style={{ width: 48, height: 48, fontSize: 20, color: '#fff', fontWeight: 700 }}
        >
          {lead.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-900 font-bold text-lg">{lead.nombre}</div>
          <div className="text-500 text-sm">{lead.email}</div>
        </div>
      </div>

      <Divider />

      <DetailRow label="Teléfono" value={lead.telefono} />
      <DetailRow label="Fuente" value={<SourceBadge source={lead.fuente} />} />
      <DetailRow label="Producto de interés" value={lead.producto_interes} />
      <DetailRow
        label="Presupuesto"
        value={lead.presupuesto != null ? `$${lead.presupuesto.toLocaleString('en-US')} USD` : undefined}
      />
      <DetailRow label="Fecha de registro" value={createdAt} />

      <div className="mt-auto pt-4">
        <Button label="Editar lead" icon="pi pi-pencil" className="w-full" onClick={onEdit} />
      </div>
    </div>
  );
}
