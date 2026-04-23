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

type Provider = 'openai' | 'claude';

const STORAGE = {
  active: 'omc_ai_provider',
  openai: 'omc_openai_key',
  claude: 'omc_claude_key',
} as const;

const PROVIDER_LABELS: Record<Provider, string> = {
  openai: 'gpt-4o-mini',
  claude: 'claude-haiku-4-5',
};

interface SummaryResult {
  analisisGeneral: string;
  fuentePrincipal: string;
  recomendaciones: string[];
  totalAnalizados: number;
  provider?: Provider;
}

function localSummary(
  stats: Awaited<ReturnType<typeof leadsApi.getStats>>,
  fuente?: LeadSource,
): SummaryResult {
  const top = [...stats.bySource].sort((a, b) => b.count - a.count)[0];
  const fuenteLabel = top ? SOURCE_LABELS[top.fuente] : 'sin datos';
  const avg = `$${Math.round(stats.avgBudget).toLocaleString('en-US')}`;
  const src = fuente ? SOURCE_LABELS[fuente] : null;

  return {
    totalAnalizados: stats.total,
    fuentePrincipal: fuenteLabel,
    analisisGeneral: src
      ? `La base de leads filtrada por ${src} muestra un comportamiento específico dentro del embudo. Con un presupuesto promedio general de ${avg} USD, este segmento representa una oportunidad de conversión directa. Los ${stats.last7Days} leads recientes de los últimos 7 días indican actividad continua en los canales de adquisición.`
      : `La base actual cuenta con ${stats.total} leads distribuidos en ${stats.bySource.length} fuentes de adquisición. El presupuesto promedio es de ${avg} USD, lo que indica un perfil de cliente con capacidad de inversión moderada-alta. Se registraron ${stats.last7Days} nuevos leads en los últimos 7 días, reflejando actividad sostenida en los embudos.`,
    recomendaciones: src
      ? [
          `Intensificar la estrategia de contenido en ${src} dado su volumen de leads.`,
          'Crear secuencias de seguimiento personalizadas para este canal con mensajes alineados al producto de mayor interés.',
          'Analizar la tasa de conversión específica de este canal para optimizar el ROI.',
        ]
      : [
          `Reforzar la inversión en ${fuenteLabel}, la fuente con mayor volumen de leads.`,
          `Con un presupuesto promedio de ${avg}, enfocar ofertas en el rango de valor percibido del mercado objetivo.`,
          'Implementar una secuencia de nurturing para los leads sin producto de interés definido.',
          'Revisar los leads sin presupuesto registrado para calificarlos antes de avanzar en el pipeline.',
        ],
  };
}

export default function AiSummary() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [fuente, setFuente] = useState<LeadSource | undefined>();
  const [fechaDesde, setFechaDesde] = useState<Nullable<Date>>(null);
  const [fechaHasta, setFechaHasta] = useState<Nullable<Date>>(null);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const active = localStorage.getItem(STORAGE.active) as Provider | null;
    if (active) {
      const key = localStorage.getItem(STORAGE[active]) ?? '';
      if (key) {
        setProvider(active);
        setApiKey(key);
        return;
      }
    }
    setProvider(null);
    setApiKey('');
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg('');
    setResult(null);
    try {
      const stats = await leadsApi.getStats();

      if (provider && apiKey) {
        const res = await fetch('/api/ai-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-provider': provider,
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            stats,
            fuente,
            fechaDesde: fechaDesde?.toISOString().split('T')[0],
            fechaHasta: fechaHasta?.toISOString().split('T')[0],
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Error ${res.status}`);
        }

        const data = await res.json();
        setResult({ ...data, totalAnalizados: stats.total, provider });
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

  const providerTag = () => {
    if (!provider) {
      return (
        <Link href="/settings">
          <Tag severity="secondary" value="Configurar IA" icon="pi pi-cog" style={{ cursor: 'pointer' }} />
        </Link>
      );
    }
    const colors: Record<Provider, 'success' | 'warning'> = { openai: 'success', claude: 'warning' };
    return <Tag severity={colors[provider]} value={provider === 'openai' ? 'OpenAI' : 'Claude'} icon="pi pi-check" />;
  };

  return (
    <div className="card">
      <div className="flex align-items-center justify-content-between mb-1">
        <div className="flex align-items-center gap-2">
          <i className="pi pi-sparkles text-purple-500 text-xl" />
          <h5 className="m-0">Resumen inteligente</h5>
        </div>
        {providerTag()}
      </div>
      <p className="text-500 text-sm mt-1 mb-4">
        {provider
          ? `Genera un análisis ejecutivo con ${PROVIDER_LABELS[provider]} usando tus datos reales.`
          : 'Genera un análisis local o conecta un proveedor de IA en Configuración.'}
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
          label={provider ? 'Generar con IA' : 'Generar resumen'}
          icon={provider ? 'pi pi-sparkles' : 'pi pi-chart-bar'}
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
          <span className="text-red-500 text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Resultado */}
      {result && !loading && (
        <div className="surface-50 border-round p-4">
          <div className="flex align-items-center justify-content-between mb-3">
            <div className="flex align-items-center gap-3 flex-wrap">
              <span className="text-500 text-sm">
                Analizados: <strong className="text-900">{result.totalAnalizados}</strong>
              </span>
              <span className="text-300">|</span>
              <span className="text-500 text-sm">
                Fuente principal: <strong className="text-900">{result.fuentePrincipal}</strong>
              </span>
            </div>
            {result.provider
              ? <Tag severity={result.provider === 'openai' ? 'success' : 'warning'} value={PROVIDER_LABELS[result.provider]} icon="pi pi-sparkles" />
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
