'use client';
import { useState, useEffect } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { Nullable } from 'primereact/ts-helpers';
import Link from 'next/link';
import { leadsApi } from '../../services/leadsApi';
import { LeadSource, SOURCE_OPTIONS, SOURCE_LABELS } from '../../types/lead';

const STORAGE_KEY = 'omc_openai_key';

interface SummaryResult {
  analisisGeneral: string;
  fuentePrincipal: string;
  recomendaciones: string[];
  totalAnalizados: number;
  usedAI?: boolean;
}

function localSummary(
  stats: Awaited<ReturnType<typeof leadsApi.getStats>>,
  fuente?: LeadSource,
): SummaryResult {
  const top = stats.bySource.sort((a, b) => b.count - a.count)[0];
  const fuenteLabel = top ? SOURCE_LABELS[top.fuente] : 'sin datos';
  const avgFormatted = `$${Math.round(stats.avgBudget).toLocaleString('en-US')}`;
  const focusedSource = fuente ? SOURCE_LABELS[fuente] : null;

  return {
    totalAnalizados: stats.total,
    fuentePrincipal: fuenteLabel,
    usedAI: false,
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

async function aiSummary(
  stats: Awaited<ReturnType<typeof leadsApi.getStats>>,
  apiKey: string,
  fuente?: LeadSource,
  fechaDesde?: string,
  fechaHasta?: string,
): Promise<SummaryResult> {
  const res = await fetch('/api/ai-summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-openai-key': apiKey,
    },
    body: JSON.stringify({ stats, fuente, fechaDesde, fechaHasta }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Error ${res.status}`);
  }

  const data = await res.json();
  return { ...data, totalAnalizados: stats.total, usedAI: true };
}

export default function AiSummary() {
  const [apiKey, setApiKey] = useState('');
  const [fuente, setFuente] = useState<LeadSource | undefined>();
  const [fechaDesde, setFechaDesde] = useState<Nullable<Date>>(null);
  const [fechaHasta, setFechaHasta] = useState<Nullable<Date>>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setApiKey(localStorage.getItem(STORAGE_KEY) ?? '');
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    try {
      const stats = await leadsApi.getStats();
      if (apiKey) {
        const summary = await aiSummary(
          stats,
          apiKey,
          fuente,
          fechaDesde?.toISOString().split('T')[0],
          fechaHasta?.toISOString().split('T')[0],
        );
        setResult(summary);
      } else {
        await new Promise((r) => setTimeout(r, 900));
        setResult(localSummary(stats, fuente));
      }
    } catch (e: any) {
      setErrorMsg(e.message ?? 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex align-items-center justify-content-between mb-1">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-sparkles text-purple-500 text-xl" />
          <h5 className="m-0">Resumen inteligente</h5>
        </div>
        {apiKey ? (
          <Tag severity="success" value="OpenAI conectado" icon="pi pi-check" />
        ) : (
          <Link href="/settings">
            <Tag severity="secondary" value="Configurar OpenAI" icon="pi pi-cog" style={{ cursor: 'pointer' }} />
          </Link>
        )}
      </div>
      <p className="text-500 text-sm mt-1 mb-4">
        {apiKey
          ? 'Genera un análisis ejecutivo con gpt-4o-mini usando tus datos reales.'
          : 'Genera un análisis local o conecta OpenAI en Configuración para usar IA real.'}
      </p>

      {/* Filtros */}
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
          label={apiKey ? 'Generar con IA' : 'Generar resumen'}
          icon={apiKey ? 'pi pi-sparkles' : 'pi pi-chart-bar'}
          onClick={handleGenerate}
          loading={loading}
          className="p-button-outlined"
        />
      </div>

      {/* Carga */}
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
      {errorMsg && !loading && (
        <div className="flex align-items-center gap-2 p-3 border-round surface-100">
          <i className="pi pi-exclamation-circle text-red-500" />
          <span className="text-red-500">{errorMsg}</span>
        </div>
      )}

      {/* Resultado */}
      {result && !loading && (
        <div className="surface-50 border-round p-4">
          <div className="flex align-items-center justify-content-between mb-3">
            <div className="flex align-items-center gap-3">
              <span className="text-500 text-sm">Leads analizados: <strong className="text-900">{result.totalAnalizados}</strong></span>
              <span className="text-300">|</span>
              <span className="text-500 text-sm">Fuente principal: <strong className="text-900">{result.fuentePrincipal}</strong></span>
            </div>
            {result.usedAI
              ? <Tag severity="success" value="gpt-4o-mini" icon="pi pi-sparkles" />
              : <Tag severity="secondary" value="Análisis local" />
            }
          </div>

          <div className="mb-4">
            <span className="font-semibold text-900 block mb-2">Análisis general</span>
            <p className="text-700 line-height-3 m-0">{result.analisisGeneral}</p>
          </div>

          <div>
            <span className="font-semibold text-900 block mb-2">Recomendaciones</span>
            <ul className="m-0 pl-3">
              {result.recomendaciones.map((rec, i) => (
                <li key={i} className="text-700 line-height-3 mb-2">{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!result && !loading && !errorMsg && (
        <div className="flex align-items-center justify-content-center py-5 text-400 gap-2">
          <i className="pi pi-sparkles" />
          <span>Configura los filtros y haz clic en &quot;Generar resumen&quot;</span>
        </div>
      )}
    </div>
  );
}
