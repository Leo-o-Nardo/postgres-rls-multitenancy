import { useEffect, useState } from 'react';

import { fetchStats, type Stats } from '@/lib/api';

export const WINDOW_MS = 60_000;
const POLL_MS = 1_000;

export interface Sample {
  t: number;
  latency: number;
  writes: number;
}

/** Polls the stats endpoint for a tenant and keeps the last 60 s of samples. */
export function useLiveStats(tenantId: string | null) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setStats(null);
    setSamples([]);
    if (!tenantId) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const data = await fetchStats(tenantId);
        if (!active) return;
        const now = Date.now();
        setStats(data);
        setOnline(true);
        setSamples((prev) => [
          ...prev.filter((s) => now - s.t <= WINDOW_MS),
          { t: now, latency: data.read_latency_ms, writes: data.write_speed },
        ]);
      } catch {
        if (active) setOnline(false);
      } finally {
        if (active) timer = setTimeout(poll, POLL_MS);
      }
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [tenantId]);

  return { stats, samples, online };
}

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
