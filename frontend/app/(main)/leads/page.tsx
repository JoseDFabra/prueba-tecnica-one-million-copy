'use client';
import { useState, useCallback, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { Sidebar } from 'primereact/sidebar';
import { Paginator } from 'primereact/paginator';
import { Nullable } from 'primereact/ts-helpers';
import { useLeads } from '../../hooks/useLeads';
import { Lead, LeadSource, SOURCE_OPTIONS, SOURCE_LABELS } from '../../types/lead';
import { leadsApi } from '../../services/leadsApi';
import LeadForm from '../../components/leads/LeadForm';
import SourceBadge from '../../components/leads/SourceBadge';
import LeadDetail from '../../components/leads/LeadDetail';

export default function LeadsPage() {
  const toast = useRef<Toast>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [fuente, setFuente] = useState<LeadSource | 'all'>('all');
  const [fechaDesde, setFechaDesde] = useState<Nullable<Date>>(null);
  const [fechaHasta, setFechaHasta] = useState<Nullable<Date>>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const { leads, total, totalPages, loading, error, refresh } = useLeads({
    page,
    search,
    fuente: fuente === 'all' ? undefined : fuente,
    fechaDesde: fechaDesde?.toISOString().split('T')[0],
    fechaHasta: fechaHasta?.toISOString().split('T')[0],
    limit: 10,
  });

  const notify = (summary: string, detail: string, severity: 'success' | 'error' = 'success') =>
    toast.current?.show({ severity, summary, detail, life: 3000 });

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleClearFilters = () => {
    setSearch('');
    setSearchInput('');
    setFuente('all');
    setFechaDesde(null);
    setFechaHasta(null);
    setPage(1);
  };

  const handleCreate = async (data: any) => {
    setFormLoading(true);
    try {
      await leadsApi.create(data);
      notify('Lead creado', `${data.nombre} fue agregado correctamente`);
      setCreateOpen(false);
      refresh();
    } catch (e: any) {
      notify('Error', e.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (data: any) => {
    if (!editLead) return;
    setFormLoading(true);
    try {
      await leadsApi.update(editLead.id, data);
      notify('Lead actualizado', `${data.nombre} fue actualizado correctamente`);
      setEditLead(null);
      refresh();
    } catch (e: any) {
      notify('Error', e.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = (lead: Lead) => {
    confirmDialog({
      message: `¿Eliminar a ${lead.nombre}? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await leadsApi.delete(lead.id);
          notify('Lead eliminado', `${lead.nombre} fue eliminado`);
          refresh();
        } catch (e: any) {
          notify('Error', e.message, 'error');
        }
      },
    });
  };

  const dateBody = (row: Lead) =>
    new Date(row.createdAt).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const budgetBody = (row: Lead) =>
    row.presupuesto != null
      ? `$${row.presupuesto.toLocaleString('en-US')}`
      : <span className="text-400">—</span>;

  const actionsBody = (row: Lead) => (
    <div className="flex gap-1">
      <Button icon="pi pi-eye" rounded text size="small" onClick={() => setDetailLead(row)} tooltip="Ver detalle" />
      <Button icon="pi pi-pencil" rounded text size="small" severity="info" onClick={() => setEditLead(row)} tooltip="Editar" />
      <Button icon="pi pi-trash" rounded text size="small" severity="danger" onClick={() => handleDelete(row)} tooltip="Eliminar" />
    </div>
  );

  return (
    <div className="grid">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="col-12">
        <div className="card">
          <div className="flex align-items-center justify-content-between mb-4">
            <h4 className="m-0 text-900 font-semibold">Leads</h4>
            <Button label="Nuevo lead" icon="pi pi-plus" onClick={() => setCreateOpen(true)} />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-4 align-items-end">
            <div className="flex gap-1">
              <InputText
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar por nombre o email"
                className="w-15rem"
              />
              <Button icon="pi pi-search" onClick={handleSearch} />
            </div>

            <Dropdown
              value={fuente}
              options={[{ label: 'Todas las fuentes', value: 'all' as const }, ...SOURCE_OPTIONS]}
              onChange={(e) => { setFuente(e.value as LeadSource | 'all'); setPage(1); }}
              placeholder="Fuente"
              className="w-12rem"
            />

            <Calendar
              value={fechaDesde}
              onChange={(e) => { setFechaDesde(e.value as Nullable<Date>); setPage(1); }}
              placeholder="Desde"
              dateFormat="dd/mm/yy"
              className="w-10rem"
              showIcon
            />

            <Calendar
              value={fechaHasta}
              onChange={(e) => { setFechaHasta(e.value as Nullable<Date>); setPage(1); }}
              placeholder="Hasta"
              dateFormat="dd/mm/yy"
              className="w-10rem"
              showIcon
            />

            {(search || fuente || fechaDesde || fechaHasta) && (
              <Button label="Limpiar" icon="pi pi-times" severity="secondary" outlined onClick={handleClearFilters} />
            )}
          </div>

          {/* Tabla */}
          {error ? (
            <div className="flex flex-column align-items-center py-6 gap-3">
              <i className="pi pi-exclamation-circle text-4xl text-red-400" />
              <span className="text-600">Error al cargar los leads. Verifica que el servidor esté activo.</span>
              <Button label="Reintentar" icon="pi pi-refresh" onClick={refresh} />
            </div>
          ) : (
            <>
              <DataTable
                value={leads}
                loading={loading}
                emptyMessage={
                  <div className="flex flex-column align-items-center py-5 gap-2">
                    <i className="pi pi-inbox text-3xl text-400" />
                    <span className="text-500">No hay leads que coincidan</span>
                  </div>
                }
                rowHover
                stripedRows
                size="small"
              >
                <Column field="nombre" header="Nombre" sortable style={{ minWidth: '150px' }} />
                <Column field="email" header="Email" style={{ minWidth: '180px' }} />
                <Column field="telefono" header="Teléfono" body={(r) => r.telefono ?? <span className="text-400">—</span>} />
                <Column
                  field="fuente"
                  header="Fuente"
                  body={(r) => <SourceBadge source={r.fuente} />}
                />
                <Column field="producto_interes" header="Producto" body={(r) => r.producto_interes ?? <span className="text-400">—</span>} style={{ minWidth: '150px' }} />
                <Column field="presupuesto" header="Presupuesto" body={budgetBody} sortable />
                <Column field="createdAt" header="Fecha" body={dateBody} sortable style={{ minWidth: '110px' }} />
                <Column body={actionsBody} style={{ width: '120px' }} />
              </DataTable>

              <Paginator
                first={(page - 1) * 10}
                rows={10}
                totalRecords={total}
                onPageChange={(e) => setPage(e.page + 1)}
                className="mt-3"
              />
            </>
          )}
        </div>
      </div>

      {/* Modal crear */}
      <Dialog
        visible={createOpen}
        onHide={() => setCreateOpen(false)}
        header="Nuevo lead"
        style={{ width: '480px' }}
        modal
      >
        <LeadForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          loading={formLoading}
        />
      </Dialog>

      {/* Modal editar */}
      <Dialog
        visible={!!editLead}
        onHide={() => setEditLead(null)}
        header="Editar lead"
        style={{ width: '480px' }}
        modal
      >
        {editLead && (
          <LeadForm
            defaultValues={editLead}
            onSubmit={handleEdit}
            onCancel={() => setEditLead(null)}
            loading={formLoading}
          />
        )}
      </Dialog>

      {/* Drawer detalle */}
      <Sidebar
        visible={!!detailLead}
        onHide={() => setDetailLead(null)}
        position="right"
        style={{ width: '420px' }}
        header="Detalle del lead"
      >
        {detailLead && <LeadDetail lead={detailLead} onEdit={() => { setEditLead(detailLead); setDetailLead(null); }} />}
      </Sidebar>
    </div>
  );
}
