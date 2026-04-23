'use client';
import { Chart } from 'primereact/chart';
import { Skeleton } from 'primereact/skeleton';
import { Button } from 'primereact/button';
import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';
import { useLeadStats } from '../hooks/useLeads';
import { LayoutContext } from '../../layout/context/layoutcontext';
import { SOURCE_LABELS, LeadSource } from '../types/lead';
import AiSummary from '../components/leads/AiSummary';

const SOURCE_COLORS: Record<LeadSource, string> = {
  instagram: '#f59e0b',
  facebook: '#3b82f6',
  landing_page: '#10b981',
  referido: '#8b5cf6',
  otro: '#ef4444',
};

export default function Dashboard() {
  const { stats, loading, error, refresh } = useLeadStats();
  const { layoutConfig } = useContext(LayoutContext);
  const isDark = layoutConfig.colorScheme !== 'light';

  const [chartData, setChartData] = useState<any>(null);
  const [chartOptions, setChartOptions] = useState<any>(null);

  useEffect(() => {
    if (!stats) return;
    const textColor = isDark ? '#ebedef' : '#495057';
    const gridColor = isDark ? 'rgba(160,167,181,.3)' : '#ebedef';

    setChartData({
      labels: stats.bySource.map((s) => SOURCE_LABELS[s.fuente]),
      datasets: [
        {
          data: stats.bySource.map((s) => s.count),
          backgroundColor: stats.bySource.map((s) => SOURCE_COLORS[s.fuente]),
          hoverBackgroundColor: stats.bySource.map((s) => SOURCE_COLORS[s.fuente]),
        },
      ],
    });

    setChartOptions({
      plugins: {
        legend: { labels: { color: textColor, usePointStyle: true } },
      },
    });
  }, [stats, isDark]);

  const statCards = [
    {
      label: 'Total leads',
      value: stats?.total ?? 0,
      icon: 'pi pi-users',
      bg: 'bg-blue-100',
      color: 'text-blue-500',
    },
    {
      label: 'Últimos 7 días',
      value: stats?.last7Days ?? 0,
      icon: 'pi pi-calendar',
      bg: 'bg-green-100',
      color: 'text-green-500',
    },
    {
      label: 'Presupuesto promedio',
      value: stats ? `$${Math.round(stats.avgBudget).toLocaleString('en-US')}` : '$0',
      icon: 'pi pi-dollar',
      bg: 'bg-orange-100',
      color: 'text-orange-500',
    },
    {
      label: 'Fuente principal',
      value: stats?.bySource.length
        ? SOURCE_LABELS[stats.bySource.sort((a, b) => b.count - a.count)[0].fuente]
        : '—',
      icon: 'pi pi-chart-pie',
      bg: 'bg-purple-100',
      color: 'text-purple-500',
    },
  ];

  if (error) {
    return (
      <div className="card flex flex-column align-items-center gap-3 py-6">
        <i className="pi pi-exclamation-circle text-4xl text-red-400" />
        <span className="text-600">No se pudieron cargar las estadísticas</span>
        <Button label="Reintentar" icon="pi pi-refresh" onClick={refresh} />
      </div>
    );
  }

  return (
    <div className="grid">
      {/* KPI Cards */}
      {statCards.map((card) => (
        <div key={card.label} className="col-12 sm:col-6 xl:col-3">
          <div className="card mb-0 h-full">
            <div className="flex justify-content-between mb-3">
              <div>
                <span className="block text-500 font-medium mb-2">{card.label}</span>
                {loading ? (
                  <Skeleton width="5rem" height="1.75rem" />
                ) : (
                  <div className="text-900 font-bold text-2xl">{card.value}</div>
                )}
              </div>
              <div
                className={`flex align-items-center justify-content-center ${card.bg} border-round`}
                style={{ width: '2.75rem', height: '2.75rem' }}
              >
                <i className={`${card.icon} ${card.color} text-xl`} />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Gráfica por fuente */}
      <div className="col-12 lg:col-6">
        <div className="card h-full">
          <div className="flex align-items-center justify-content-between mb-4">
            <h5 className="m-0">Leads por fuente</h5>
            <Link href="/leads">
              <Button label="Ver todos" icon="pi pi-arrow-right" iconPos="right" text size="small" />
            </Link>
          </div>
          {loading || !chartData ? (
            <div className="flex justify-content-center align-items-center" style={{ height: 280 }}>
              <Skeleton width="280px" height="280px" shape="circle" />
            </div>
          ) : (
            <Chart type="doughnut" data={chartData} options={chartOptions} style={{ maxWidth: 320, margin: '0 auto' }} />
          )}
        </div>
      </div>

      {/* Tabla por fuente */}
      <div className="col-12 lg:col-6">
        <div className="card h-full">
          <h5 className="mb-4">Distribución de leads</h5>
          {loading ? (
            <div className="flex flex-column gap-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height="2rem" />)}
            </div>
          ) : (
            <ul className="list-none p-0 m-0">
              {stats?.bySource
                .sort((a, b) => b.count - a.count)
                .map((s) => {
                  const pct = stats.total ? Math.round((s.count / stats.total) * 100) : 0;
                  return (
                    <li key={s.fuente} className="flex align-items-center justify-content-between mb-3">
                      <div className="flex align-items-center gap-2">
                        <span
                          className="border-circle inline-block"
                          style={{ width: 10, height: 10, background: SOURCE_COLORS[s.fuente] }}
                        />
                        <span className="text-900 font-medium">{SOURCE_LABELS[s.fuente]}</span>
                      </div>
                      <div className="flex align-items-center gap-3">
                        <div className="surface-300 border-round overflow-hidden" style={{ width: '6rem', height: 8 }}>
                          <div
                            className="h-full border-round"
                            style={{ width: `${pct}%`, background: SOURCE_COLORS[s.fuente] }}
                          />
                        </div>
                        <span className="text-600 w-3rem text-right">{s.count} ({pct}%)</span>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </div>

      {/* AI Summary */}
      <div className="col-12">
        <AiSummary />
      </div>
    </div>
  );
}
