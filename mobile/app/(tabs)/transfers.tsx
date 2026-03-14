import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import { Transfer } from '../../types';

const transferTypes = [
  { type: 'internal', icon: 'repeat' as const, label: 'Between Accounts', desc: 'Move money between your accounts', route: '/transfers/internal', gradient: ['#1C2030', '#141720'] as const },
  { type: 'wire', icon: 'flash' as const, label: 'Wire Transfer', desc: 'Send wire transfers domestically', route: '/transfers/wire', gradient: ['#201C18', '#1A1510'] as const },
  { type: 'international', icon: 'globe' as const, label: 'International', desc: 'Send money internationally', route: '/transfers/international', gradient: ['#18201C', '#101A15'] as const },
];

export default function Transfers() {
  const router = useRouter();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransfers = async () => {
    try {
      const res = await api.get<{ transfers: Transfer[] }>(endpoints.transfers);
      if (res.success) setTransfers(res.transfers?.slice(0, 10) || []);
    } catch (err) {
      console.warn('Failed to fetch transfers:', err);
    }
  };

  useFocusEffect(useCallback(() => { fetchTransfers(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransfers();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

        {/* Transfer Type Cards */}
        <View style={styles.section}>
          {transferTypes.map(t => (
            <TouchableOpacity
              key={t.type}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(t.route as any);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[...t.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.typeCard}
              >
                <View style={styles.typeIcon}>
                  <Ionicons name={t.icon} size={20} color={colors.gold} />
                </View>
                <View style={styles.typeInfo}>
                  <Text style={styles.typeLabel}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
                </View>
                <View style={styles.chevronWrap}>
                  <Ionicons name="chevron-forward" size={16} color={colors.gold} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transfers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transfers</Text>
            {transfers.length > 0 && (
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {transfers.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="swap-horizontal-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No recent transfers</Text>
              <Text style={styles.emptySubtext}>Your transfer history will appear here</Text>
            </View>
          ) : (
            <View style={styles.transferList}>
              {transfers.map((t, idx) => (
                <View key={t._id} style={[styles.transferItem, idx === transfers.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.transferIcon, { backgroundColor: t.type === 'transfer-in' ? colors.success + '15' : colors.error + '15' }]}>
                    <Ionicons
                      name={t.type === 'transfer-in' ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={t.type === 'transfer-in' ? colors.success : colors.error}
                    />
                  </View>
                  <View style={styles.transferInfo}>
                    <Text style={styles.transferRef} numberOfLines={1}>{t.reference}</Text>
                    <Text style={styles.transferDate}>{formatDate(t.date)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.transferAmount, { color: t.type === 'transfer-in' ? colors.success : colors.text }]}>
                      {t.type === 'transfer-in' ? '+' : '-'}${t.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: t.status === 'completed' ? colors.success + '15' : colors.warning + '15' }]}>
                      <View style={[styles.statusDot, { backgroundColor: t.status === 'completed' ? colors.success : colors.warning }]} />
                      <Text style={[styles.transferStatus, { color: t.status === 'completed' ? colors.success : colors.warning }]}>
                        {t.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 30 }} />
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  seeAll: { color: colors.gold, fontSize: 13, fontWeight: '500' },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border + '30',
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.goldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  typeInfo: { flex: 1 },
  typeLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  typeDesc: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.goldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border + '30',
    overflow: 'hidden',
  },
  transferItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '25',
  },
  transferIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transferInfo: { flex: 1 },
  transferRef: { color: colors.text, fontSize: 14, fontWeight: '500' },
  transferDate: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  transferAmount: { fontSize: 14, fontWeight: '600' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 3 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  transferStatus: { fontSize: 10, fontWeight: '500', textTransform: 'capitalize' },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textSecondary, fontSize: 15, fontWeight: '500', marginTop: 12 },
  emptySubtext: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
});
