'use client';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Skeleton } from 'primereact/skeleton';
import { Nullable } from 'primereact/ts-helpers';
import { leadsApi } from '../../services/leadsApi';
import { LeadSource, SOURCE_OPTIONS, SOURCE_LABELS } from '../../types/lead';

interface SummaryResult {
  analisisGeneral: string;
  fuentePrincipal: string;
  recomendaciones: string[];
  totalAnalizados: number;
}

function generateSummary(stats: Awaited<ReturnType<typeof leadsApi.getStats>>, fuente?: LeadSource): SummaryResult {
  const top = stats.bySource.sort((a, b) => b.count - a.count)[0];
  const fuenteLabel = top ? SOURCE_LABELS[top.fuente] : 'sin datos';
  const avgFormatted = `$${Math.round(stats.avgBudget).toLocaleString('en-US')}`;
  const focusedSource = fuente ? SOURCE_LABELS[fuente] : null;

  return {
    totalAnalizados: stats.total,
    fuentePrincipal: fuenteLabel,
    analisisGeneral: focusedSource
      ? `La base de leads filtrada por ${focusedSource} muestra un comportamiento específico dentro del embudo. Con un presupuesto promedio general de ${avgFormatted} USD, este segmento representa una oportunidad de conversión directa. Los ${stats.last7Days} leads recientes de los últimos 7 días indican actividad continua en los canales de adquisición.`
      : `La base actual cuenta con ${stats.total} leads distribuidos en ${stats.bySource.length} fuentes de adquisición. El presupuesto promedio es de ${avgFormatted} USD, lo que indica un perfil de cliente con capacidad de inversión moderada-alta. Se registraron ${stats.last7Days} nuevos leads en los últimos 7 días, reflejando actividad sostenida en los embudos.`,
    recomendaciones: focusedSource
      ? [
          `Intensificar la estrategia de contenido en ${focusedSource} dado su volumen de leads.`,
          'Crear secuencias de seguimiento personalizadas para este canal con mensajes alineados al producto de mayor interés.',
          'Analizar la tasa de conversión específica de este canal para optimizar el ROI.',
        ]
      : [
          `Reforzar la inversión en ${fuenteLabel}, la fuente con mayor volumen de leads.`,
          `Con un presupuesto promedio de ${avgFormatted}, enfocar ofertas en el rango de valor percibido del mercado objetivo.`,
          'Implementar una secuencia de nurturing para los leads sin producto de interés definido.',
          'Revisar los leads sin presupuesto registrado para calificarlos antes de avanzar en el pipeline.',
        ],
  };
}

export default function AiSummary() {
  const [fuente, setFuente] = useState<LeadSource | undefined>();
  const [fechaDesde, setFechaDesde] = useState<Nullable<Date>>(null);
  const [fechaHasta, setFechaHasta] = useState<Nullable<Date>>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(false);
    setResult(null);
    try {
      const stats = await leadsApi.getStats();
      // Simulated delay for UX realism
      await new Promise((r) => setTimeout(r, 1200));
      setResult(generateSummary(stats, fuente));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex align-items-center gap-2 mb-1">
        <i className="pi pi-sparkles text-purple-500 text-xl" />
        <h5 className="m-0">Resumen inteligente</h5>
      </div>
      <p className="text-500 text-sm mt-1 mb-4">
        Genera un análisis ejecutivo de tus leads con recomendaciones accionables.
      </p>

      {/* Filtros opcionales */}
      <div className="flex flex-wrap gap-2 mb-4 align-items-end">
        <Dropdown
          value={fuente}
          options={[{ label: 'Todas las fuentes', value: undefined }, ...SOURCE_OPTIONS]}
          onChange={(e) => setFuente(e.value)}
          placeholder="Filtrar por fuente"
          className="w-14rem"
        />
        <Calendar
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.value as Nullable<Date>)}
          placeholder="Desde"
          dateFormat="dd/mm/yy"
          showIcon
          className="w-10rem"
        />
        <Calendar
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.value as Nullable<Date>)}
          placeholder="Hasta"
          dateFormat="dd/mm/yy"
          showIcon
          className="w-10rem"
        />
        <Button
          label="Generar resumen"
          icon="pi pi-sparkles"
          onClick={handleGenerate}
          loading={loading}
          className="p-button-outlined"
        />
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex flex-column gap-2">
          <Skeleton height="1.2rem" className="mb-1" />
          <Skeleton height="1.2rem" width="85%" className="mb-1" />
          <Skeleton height="1.2rem" width="70%" className="mb-3" />
          <Skeleton height="1rem" width="40%" className="mb-1" />
          <Skeleton height="1rem" width="60%" className="mb-1" />
          <Skeleton height="1rem" width="50%" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex align-items-center gap-2 text-red-500">
          <i className="pi pi-exclamation-circle" />
          <span>No se pudo generar el resumen. Intenta de nuevo.</span>
        </div>
      )}

      {/* Resultado */}
      {result && !loading && (
        <div className="surface-50 border-round p-4">
          <div className="flex align-items-center gap-2 mb-3">
            <span className="text-500 text-sm">Leads analizados:</span>
            <span className="font-bold text-900">{result.totalAnalizados}</span>
            <span className="mx-2 text-300">|</span>
            <span className="text-500 text-sm">Fuente principal:</span>
            <span className="font-bold text-900">{result.fuentePrincipal}</span>
          </div>

          <div className="mb-4">
            <span className="font-semibold text-900 block mb-2">Análisis general</span>
            <p className="text-700 line-height-3 m-0">{result.analisisGeneral}</p>
          </div>

          <div>
            <span className="font-semibold text-900 block mb-2">Recomendaciones</span>
            <ul className="m-0 pl-3">
              {result.recomendaciones.map((rec, i) => (
                <li key={i} className="text-700 line-height-3 mb-2">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex align-items-center justify-content-center py-5 text-400 gap-2">
          <i className="pi pi-sparkles" />
          <span>Configura los filtros y haz clic en "Generar resumen"</span>
        </div>
      )}
    </div>
  );
}
