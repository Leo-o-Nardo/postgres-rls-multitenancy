import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme';

interface Props {
  title?: string;
  aside?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

export function Card({ title, aside, style, children }: Props) {
  return (
    <View style={[styles.card, style]}>
      {(title || aside) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {aside}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
});
