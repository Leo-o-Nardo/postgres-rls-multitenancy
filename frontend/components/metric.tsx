import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

interface Props {
  label: string;
  value: string;
  unit?: string;
  mono?: boolean;
}

export function Metric({ label, value, unit, mono }: Props) {
  return (
    <View style={styles.metric}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, mono && styles.mono]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
        {unit && <Text style={styles.unit}> {unit}</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metric: { flex: 1, gap: 2 },
  label: { color: colors.textMuted, fontSize: 12 },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  mono: { fontFamily: fonts.mono, fontSize: 13, fontWeight: '400' },
  unit: { color: colors.textFaint, fontSize: 12, fontWeight: '400' },
});
