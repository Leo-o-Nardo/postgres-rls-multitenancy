import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import type { Tenant } from '@/lib/api';

interface Props {
  tenants: Tenant[];
  selected: Tenant | null;
  onSelect: (tenant: Tenant) => void;
}

export function TenantPicker({ tenants, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        onPress={() => setOpen(true)}>
        <View style={styles.triggerBody}>
          <Text style={styles.label}>Tenant</Text>
          <Text style={styles.name} numberOfLines={1}>
            {selected?.name ?? 'Select a tenant'}
          </Text>
          {selected && (
            <Text style={styles.context} numberOfLines={1}>
              app.current_tenant = &apos;{selected.id.slice(0, 8)}…&apos;
            </Text>
          )}
        </View>
        <Feather name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet}>
            <Text style={styles.sheetTitle}>Switch tenant</Text>
            <Text style={styles.sheetHint}>
              Every query runs under the selected tenant&apos;s row-level security context.
            </Text>
            {tenants.map((tenant) => (
              <Pressable
                key={tenant.id}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                onPress={() => {
                  onSelect(tenant);
                  setOpen(false);
                }}>
                <View style={styles.triggerBody}>
                  <Text style={styles.itemName}>{tenant.name}</Text>
                  <Text style={styles.itemId}>{tenant.id}</Text>
                </View>
                {selected?.id === tenant.id && <Feather name="check" size={18} color={colors.accent} />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: { opacity: 0.7 },
  triggerBody: { flex: 1, gap: 2 },
  label: { color: colors.textMuted, fontSize: 12 },
  name: { color: colors.text, fontSize: 15, fontWeight: '600' },
  context: { color: colors.textFaint, fontSize: 12, fontFamily: fonts.mono },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 20,
  },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  sheetHint: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  itemName: { color: colors.text, fontSize: 15, fontWeight: '500' },
  itemId: { color: colors.textFaint, fontSize: 11, fontFamily: fonts.mono },
});
