import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing } from '../constants/theme';

interface AccountCardProps {
  type: 'checking' | 'savings' | 'investment';
  balance: number;
  accountNumber?: string;
  onPress?: () => void;
}

const accountConfig = {
  checking: { color: colors.checking, icon: 'wallet' as const, label: 'Checking' },
  savings: { color: colors.savings, icon: 'shield-checkmark' as const, label: 'Savings' },
  investment: { color: colors.investment, icon: 'trending-up' as const, label: 'Investment' },
};

export default function AccountCard({ type, balance, accountNumber, onPress }: AccountCardProps) {
  const config = accountConfig[type];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.accent, { backgroundColor: config.color }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name={config.icon} size={20} color={config.color} />
          <Text style={styles.label}>{config.label}</Text>
        </View>
        <Text style={styles.balance}>${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
        {accountNumber && (
          <Text style={styles.account}>AC****{accountNumber.slice(-4)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  accent: { width: 4 },
  content: { flex: 1, padding: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  balance: { color: colors.text, fontSize: 22, fontWeight: '700' },
  account: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
});
