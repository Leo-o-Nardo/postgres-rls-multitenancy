import { useEffect, useState } from 'react';

import { injectRows } from '@/lib/api';

export const LOAD_TEST_DURATION_S = 30;
export const LOAD_TEST_BATCH = 1_000;

/** Sends one batch of rows per second for a fixed duration. */
export function useLoadTest(tenantId: string | null) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rowsSent, setRowsSent] = useState(0);

  useEffect(() => {
    setRunning(false);
  }, [tenantId]);

  useEffect(() => {
    if (!running || !tenantId) return;

    setElapsed(0);
    setRowsSent(0);
    const startedAt = Date.now();

    const clock = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(Math.min(seconds, LOAD_TEST_DURATION_S));
      if (seconds >= LOAD_TEST_DURATION_S) setRunning(false);
    }, 250);

    const injector = setInterval(() => {
      injectRows(tenantId, LOAD_TEST_BATCH)
        .then(() => setRowsSent((n) => n + LOAD_TEST_BATCH))
        .catch(() => {});
    }, 1000);

    return () => {
      clearInterval(clock);
      clearInterval(injector);
    };
  }, [running, tenantId]);

  return {
    running,
    rowsSent,
    remaining: LOAD_TEST_DURATION_S - elapsed,
    progress: elapsed / LOAD_TEST_DURATION_S,
    toggle: () => setRunning((r) => !r),
  };
}
