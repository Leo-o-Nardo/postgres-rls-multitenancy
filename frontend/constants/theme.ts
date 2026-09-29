import { Platform } from 'react-native';

export const colors = {
  background: '#0B0D10',
  surface: '#14171C',
  border: '#23272E',
  text: '#E6E8EB',
  textMuted: '#8A919C',
  textFaint: '#5B626D',
  accent: '#4C8DFF',
  ok: '#3FB950',
  warn: '#D29922',
  critical: '#F85149',
};

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
};

// Read latency thresholds (ms) used for status colors.
export const latencyThresholds = { warn: 50, critical: 200 };

export type LatencyStatus = 'healthy' | 'degraded' | 'critical';

export function latencyStatus(ms: number): LatencyStatus {
  if (ms >= latencyThresholds.critical) return 'critical';
  if (ms >= latencyThresholds.warn) return 'degraded';
  return 'healthy';
}

export const statusColor: Record<LatencyStatus, string> = {
  healthy: colors.ok,
  degraded: colors.warn,
  critical: colors.critical,
};
