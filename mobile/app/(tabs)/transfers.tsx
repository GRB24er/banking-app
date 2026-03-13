import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { Transfer } from '../../types';

const transferTypes = [
  { type: 'internal', icon: 'repeat' as const, label: 'Between Accounts', desc: 'Move money between your accounts', route: '/transfers/internal' },
  { type: 'wire', icon: 'flash' as const, label: 'Wire Transfer', desc: 'Send wire transfers domestically', route: '/transfers/wire' },
  { type: 'international', icon: 'globe' as const, label: 'International', desc: 'Send money internationally', route: '/transfers/international' },
];

export default function Transfers() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransfers = async () => {
    try {
      const res = await api.get<{ transfers: Transfer[] }>(endpoints.transfers);
      if (res.success) setTransfers(res.transfers?.slice(0, 10) || []);
    } catch {}
  };

  useFocusEffect(useCallback(() => { fetchTransfers(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransfers();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Transfers</Text>
          <Text style={styles.subtitle}>Send money quickly and securely</Text>
        </View>

        <View style={styles.section}>
          {transferTypes.map(t => (
            <TouchableOpacity key={t.type} style={styles.typeCard} onPress={() => router.push(t.route as any)} activeOpacity={0.7}>
              <View style={styles.typeIcon}>
                <Ionicons name={t.icon} size={22} color={colors.gold} />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeLabel}>{t.label}</Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transfers</Text>
          {transfers.length === 0 ? (
            <Text style={styles.emptyText}>No recent transfers</Text>
          ) : (
            transfers.map(t => (
              <View key={t._id} style={styles.transferItem}>
                <View>
                  <Text style={styles.transferRef}>{t.reference}</Text>
                  <Text style={styles.transferDate}>{new Date(t.date).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.transferAmount, { color: t.type === 'transfer-in' ? colors.success : colors.error }]}>
                    {t.type === 'transfer-in' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={[styles.transferStatus, { color: t.status === 'completed' ? colors.success : colors.warning }]}>{t.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeInfo: { flex: 1 },
  typeLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  typeDesc: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  transferItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  transferRef: { color: colors.text, fontSize: 14, fontWeight: '500' },
  transferDate: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  transferAmount: { fontSize: 14, fontWeight: '600' },
  transferStatus: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
});
