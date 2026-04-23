'use client';
import { useState, useEffect, useCallback } from 'react';
import { leadsApi } from '../services/leadsApi';
import { Lead, LeadFilters } from '../types/lead';

export function useLeads(filters: LeadFilters) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    leadsApi
      .getAll(filters)
      .then((res) => {
        if (cancelled) return;
        setLeads(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.search, filters.fuente, filters.fechaDesde, filters.fechaHasta, rev]);

  const refresh = useCallback(() => setRev((v) => v + 1), []);

  return { leads, total, totalPages, loading, error, refresh };
}

export function useLeadStats() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof leadsApi.getStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(false);
    leadsApi
      .getStats()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, loading, error, refresh: fetch };
}
