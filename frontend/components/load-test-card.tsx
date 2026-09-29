import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { colors } from '@/constants/theme';
import { LOAD_TEST_BATCH, LOAD_TEST_DURATION_S } from '@/hooks/use-load-test';

interface Props {
  running: boolean;
  progress: number;
  remaining: number;
  rowsSent: number;
  disabled: boolean;
  onToggle: () => void;
}

export function LoadTestCard({ running, progress, remaining, rowsSent, disabled, onToggle }: Props) {
  const summary = running
    ? `${rowsSent.toLocaleString('en-US')} rows · ${remaining}s left`
    : `${LOAD_TEST_BATCH.toLocaleString('en-US')} rows/s · ${LOAD_TEST_DURATION_S}s`;

  return (
    <Card title="Load test" aside={<Text style={styles.summary}>{summary}</Text>}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round((running ? progress : 0) * 100)}%` }]} />
      </View>

      <Pressable
        disabled={disabled}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.button,
          running && styles.buttonRunning,
          (pressed || disabled) && styles.dimmed,
        ]}>
        <Feather
          name={running ? 'square' : 'play'}
          size={14}
          color={running ? colors.text : colors.accent}
        />
        <Text style={[styles.buttonText, running && { color: colors.text }]}>
          {running ? 'Stop load test' : 'Start load test'}
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  summary: { color: colors.textMuted, fontSize: 12, fontVariant: ['tabular-nums'] },
  track: { height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 3, backgroundColor: colors.accent },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  buttonRunning: { borderColor: colors.border, backgroundColor: colors.border },
  buttonText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  dimmed: { opacity: 0.6 },
});
