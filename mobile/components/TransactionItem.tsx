import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/theme';
import { Transaction } from '../types';

interface TransactionItemProps {
  item: Transaction;
}

const typeConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  deposit: { icon: 'arrow-down-circle', color: colors.success, bg: 'rgba(34,197,94,0.12)' },
  withdrawal: { icon: 'arrow-up-circle', color: colors.error, bg: 'rgba(239,68,68,0.12)' },
  'transfer-out': { icon: 'send', color: colors.error, bg: 'rgba(239,68,68,0.12)' },
  'transfer-in': { icon: 'download', color: colors.success, bg: 'rgba(34,197,94,0.12)' },
  fee: { icon: 'receipt', color: colors.warning, bg: 'rgba(245,158,11,0.12)' },
  interest: { icon: 'sparkles', color: colors.info, bg: 'rgba(59,130,246,0.12)' },
  payment: { icon: 'card', color: colors.error, bg: 'rgba(239,68,68,0.12)' },
};

const defaultConfig = { icon: 'swap-horizontal' as keyof typeof Ionicons.glyphMap, color: colors.textSecondary, bg: colors.surfaceLight };

export default function TransactionItem({ item }: TransactionItemProps) {
  const config = typeConfig[item.type] || defaultConfig;
  const isCredit = ['deposit', 'transfer-in', 'interest'].includes(item.type);
  const amount = item.rawAmount || item.amount;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={20} color={config.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>
          {item.description || item.reference}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{formatDate(item.date || item.createdAt)}</Text>
          {item.status && item.status !== 'completed' && (
            <View style={[styles.statusBadge, {
              backgroundColor: item.status === 'pending' ? colors.warning + '20' : colors.error + '20'
            }]}>
              <Text style={[styles.statusText, {
                color: item.status === 'pending' ? colors.warning : colors.error
              }]}>
                {item.status}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.amount, { color: isCredit ? colors.success : colors.text }]}>
        {isCredit ? '+' : '-'}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  description: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
