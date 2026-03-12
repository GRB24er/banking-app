import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing } from '../constants/theme';
import { Transaction } from '../types';

const typeConfig: Record<string, { icon: any; color: string }> = {
  deposit: { icon: 'arrow-down', color: colors.success },
  'transfer-in': { icon: 'arrow-down', color: colors.success },
  withdrawal: { icon: 'arrow-up', color: colors.error },
  'transfer-out': { icon: 'arrow-up', color: colors.error },
  payment: { icon: 'arrow-up', color: colors.error },
  fee: { icon: 'alert-circle', color: colors.warning },
  interest: { icon: 'star', color: colors.gold },
};

const statusColors: Record<string, string> = {
  completed: colors.success,
  approved: colors.success,
  pending: colors.warning,
  pending_verification: colors.warning,
  processing: colors.info,
  rejected: colors.error,
  failed: colors.error,
};

export default function TransactionItem({ item }: { item: Transaction }) {
  const config = typeConfig[item.type] || { icon: 'swap-horizontal', color: colors.textMuted };
  const isCredit = item.amount >= 0;
  const statusColor = statusColors[item.status] || colors.textMuted;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>
      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>{item.description}</Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(item.date)}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.amount, { color: isCredit ? colors.success : colors.error }]}>
        {isCredit ? '+' : ''}{item.amount < 0 ? '-' : ''}${Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  details: { flex: 1 },
  description: { color: colors.text, fontSize: 15, fontWeight: '500' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  date: { color: colors.textMuted, fontSize: 12 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  amount: { fontSize: 15, fontWeight: '600' },
});
