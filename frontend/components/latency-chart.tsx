import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import { colors } from '@/constants/theme';
import { WINDOW_MS, type Sample } from '@/hooks/use-live-stats';

interface Props {
  samples: Sample[];
}

const PAD = { top: 8, right: 4, bottom: 20, left: 44 };

// Rounds up to 1, 2 or 5 × 10^n so the axis labels stay readable.
function niceCeil(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const fraction = value / magnitude;
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Fills the space its parent gives it; the plot is sized from its own layout. */
export function LatencyChart({ samples }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View style={styles.container}>
      {/* The SVG is absolutely positioned so it never props the container open: flex alone decides the size. */}
      <View style={styles.plot} onLayout={onLayout}>
        {size.width > 0 && (
          <View style={StyleSheet.absoluteFill}>
            <Plot samples={samples} width={size.width} height={size.height} />
          </View>
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.swatchLine, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Read latency</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.swatchArea} />
          <Text style={styles.legendText}>Writes/s (relative)</Text>
        </View>
      </View>
    </View>
  );
}

function Plot({ samples, width, height }: Props & { width: number; height: number }) {
  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const bottom = PAD.top + plotH;

  const now = samples.length > 0 ? samples[samples.length - 1].t : Date.now();
  const maxLatency = niceCeil(Math.max(20, ...samples.map((s) => s.latency)));
  const maxWrites = Math.max(1, ...samples.map((s) => s.writes));

  const x = (t: number) => PAD.left + plotW * (1 - (now - t) / WINDOW_MS);
  const yLatency = (v: number) => PAD.top + plotH * (1 - v / maxLatency);
  const yWrites = (v: number) => PAD.top + plotH * (1 - v / maxWrites);

  const latencyPath = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${x(s.t).toFixed(1)},${yLatency(s.latency).toFixed(1)}`)
    .join(' ');

  const writesPath =
    samples.length > 1
      ? `M${x(samples[0].t).toFixed(1)},${bottom} ` +
        samples.map((s) => `L${x(s.t).toFixed(1)},${yWrites(s.writes).toFixed(1)}`).join(' ') +
        ` L${x(now).toFixed(1)},${bottom} Z`
      : '';

  const gridValues = [0, maxLatency / 2, maxLatency];
  const timeLabels = [
    { label: '-60s', x: PAD.left, anchor: 'start' as const },
    { label: '-30s', x: PAD.left + plotW / 2, anchor: 'middle' as const },
    { label: 'now', x: PAD.left + plotW, anchor: 'end' as const },
  ];

  return (
    <Svg width={width} height={height}>
      {gridValues.map((v) => (
        <Line
          key={`grid-${v}`}
          x1={PAD.left}
          x2={PAD.left + plotW}
          y1={yLatency(v)}
          y2={yLatency(v)}
          stroke={colors.border}
          strokeWidth={1}
        />
      ))}
      {gridValues.map((v) => (
        <SvgText
          key={`label-${v}`}
          x={PAD.left - 8}
          y={yLatency(v) + 4}
          fill={colors.textFaint}
          fontSize={11}
          textAnchor="end">
          {`${v} ms`}
        </SvgText>
      ))}
      {writesPath !== '' && <Path d={writesPath} fill={colors.textFaint} fillOpacity={0.18} />}
      {samples.length > 1 && (
        <Path d={latencyPath} stroke={colors.accent} strokeWidth={2} fill="none" strokeLinejoin="round" />
      )}
      {timeLabels.map((t) => (
        <SvgText
          key={t.label}
          x={t.x}
          y={height - 4}
          fill={colors.textFaint}
          fontSize={11}
          textAnchor={t.anchor}>
          {t.label}
        </SvgText>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  plot: { flex: 1, minHeight: 110 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatchLine: { width: 12, height: 2, borderRadius: 1 },
  swatchArea: {
    width: 12,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.textFaint,
    opacity: 0.4,
  },
  legendText: { color: colors.textMuted, fontSize: 12 },
});
