import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { LatencyChart } from '@/components/latency-chart';
import { LoadTestCard } from '@/components/load-test-card';
import { Metric } from '@/components/metric';
import { TenantPicker } from '@/components/tenant-picker';
import { colors, fonts, latencyStatus, statusColor } from '@/constants/theme';
import { percentile, useLiveStats } from '@/hooks/use-live-stats';
import { useLoadTest } from '@/hooks/use-load-test';
import { API_URL, fetchTenants, type Tenant } from '@/lib/api';

const formatMs = (value: number | null) => (value === null ? '—' : value.toFixed(1));

export default function MonitorScreen() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loadError, setLoadError] = useState(false);

  const { stats, samples, online } = useLiveStats(tenant?.id ?? null);
  const loadTest = useLoadTest(tenant?.id ?? null);

  const loadTenants = useCallback(async () => {
    setLoadError(false);
    try {
      const list = await fetchTenants();
      setTenants(list);
      setTenant((current) => current ?? list[0] ?? null);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const latencies = samples.map((s) => s.latency);
  const status = stats ? latencyStatus(stats.read_latency_ms) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* flexGrow lets the chart absorb the spare height, so the screen only scrolls on very small devices. */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>PgSaaS Monitor</Text>
            <Text style={styles.subtitle}>Postgres RLS · partitioned time series</Text>
          </View>
          <View style={styles.connection}>
            <View style={[styles.dot, { backgroundColor: online ? colors.ok : colors.critical }]} />
            <Text style={styles.connectionText}>{online ? 'Live' : 'Offline'}</Text>
          </View>
        </View>

        {loadError ? (
          <Card>
            <Text style={styles.errorTitle}>Can&apos;t reach the API</Text>
            <Text style={styles.errorBody}>{API_URL}</Text>
            <Pressable onPress={loadTenants} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </Card>
        ) : (
          <TenantPicker tenants={tenants} selected={tenant} onSelect={setTenant} />
        )}

        <Card
          title="Read latency"
          aside={
            status && (
              <View style={styles.status}>
                <View style={[styles.dot, { backgroundColor: statusColor[status] }]} />
                <Text style={[styles.statusText, { color: statusColor[status] }]}>{status}</Text>
              </View>
            )
          }>
          <Text style={styles.hero}>
            {formatMs(stats?.read_latency_ms ?? null)}
            <Text style={styles.heroUnit}> ms</Text>
          </Text>
          <View style={styles.metrics}>
            <Metric label="p50 · 60s" value={formatMs(percentile(latencies, 50))} unit="ms" />
            <Metric label="p95 · 60s" value={formatMs(percentile(latencies, 95))} unit="ms" />
            <Metric
              label="Writes"
              value={stats ? Math.round(stats.write_speed).toLocaleString('en-US') : '—'}
              unit="rows/s"
            />
          </View>
        </Card>

        <Card title="Last 60 seconds" style={styles.chartCard}>
          <LatencyChart samples={samples} />
        </Card>

        <Card title="Storage">
          <View style={styles.storage}>
            <Metric label="Active partition" value={stats?.active_partition ?? '—'} mono />
            <Metric
              label="Rows visible to tenant"
              value={stats ? stats.total_rows.toLocaleString('en-US') : '—'}
            />
          </View>
        </Card>

        <LoadTestCard
          running={loadTest.running}
          progress={loadTest.progress}
          remaining={loadTest.remaining}
          rowsSent={loadTest.rowsSent}
          disabled={!tenant}
          onToggle={loadTest.toggle}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 16, gap: 10 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  connection: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  connectionText: { color: colors.textMuted, fontSize: 12 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, fontWeight: '500', textTransform: 'capitalize' },

  hero: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  heroUnit: { color: colors.textFaint, fontSize: 16, fontWeight: '500' },
  metrics: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  chartCard: { flex: 1 },
  storage: { flexDirection: 'row', gap: 12 },

  errorTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  errorBody: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.mono, marginTop: 4 },
  retry: { alignSelf: 'flex-start', marginTop: 12 },
  retryText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
});
