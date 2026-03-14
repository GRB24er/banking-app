import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../stores/auth';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import AccountCard from '../../components/AccountCard';
import TransactionItem from '../../components/TransactionItem';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { Transaction } from '../../types';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [_, txRes] = await Promise.all([
        refreshUser(),
        api.get<{ transactions: Transaction[] }>(`${endpoints.transactions}?limit=10`),
      ]);
      if (txRes.success) setTransactions(txRes.transactions);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchData();
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const totalBalance = (user?.checkingBalance || 0) + (user?.savingsBalance || 0) + (user?.investmentBalance || 0);

  const quickActions = [
    { icon: 'swap-horizontal' as const, label: 'Transfer', route: '/(tabs)/transfers', color: '#6366F1' },
    { icon: 'cash-outline' as const, label: 'Deposit', route: '/deposit', color: '#10B981' },
    { icon: 'card-outline' as const, label: 'Cards', route: '/(tabs)/cards', color: '#F59E0B' },
    { icon: 'time-outline' as const, label: 'History', route: '/transactions', color: '#8B5CF6' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{user?.firstName || 'User'}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceWrap}>
          <LinearGradient
            colors={['#1C2030', '#141720']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <View style={styles.balanceBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.badgeText}>Live</Text>
              </View>
            </View>
            <Text style={styles.balanceAmount}>
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceFooter}>
              <View style={styles.balanceStat}>
                <Ionicons name="arrow-down-circle" size={16} color={colors.success} />
                <Text style={styles.balanceStatLabel}>Income</Text>
              </View>
              <View style={styles.balanceStat}>
                <Ionicons name="arrow-up-circle" size={16} color={colors.error} />
                <Text style={styles.balanceStatLabel}>Expenses</Text>
              </View>
            </View>
            {/* Decorative elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </LinearGradient>
        </View>

        {/* Account Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
          <View style={{ width: spacing.lg }} />
          <View style={styles.accountCardWrap}>
            <AccountCard
              type="checking"
              balance={user?.checkingBalance || 0}
              accountNumber={user?.accountNumber}
              onPress={() => router.push('/accounts/checking')}
            />
          </View>
          <View style={styles.accountCardWrap}>
            <AccountCard
              type="savings"
              balance={user?.savingsBalance || 0}
              accountNumber={user?.accountNumber}
              onPress={() => router.push('/accounts/savings')}
            />
          </View>
          <View style={styles.accountCardWrap}>
            <AccountCard
              type="investment"
              balance={user?.investmentBalance || 0}
              onPress={() => router.push('/accounts/investment')}
            />
          </View>
          <View style={{ width: spacing.md }} />
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionItem}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(action.route as any);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity
              onPress={() => router.push('/transactions')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No Recent Activity</Text>
              <Text style={styles.emptyText}>Your transactions will appear here</Text>
            </View>
          ) : (
            transactions.map(tx => <TransactionItem key={tx._id} item={tx} />)
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  greeting: { color: colors.textSecondary, fontSize: 14 },
  name: { color: colors.text, fontSize: 24, fontWeight: '700', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  balanceWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  balanceCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold + '20',
    overflow: 'hidden',
    position: 'relative',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: { color: colors.textSecondary, fontSize: 14 },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  badgeText: { color: colors.success, fontSize: 11, fontWeight: '600' },
  balanceAmount: {
    color: colors.gold,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  balanceFooter: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  balanceStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceStatLabel: { color: colors.textSecondary, fontSize: 13 },
  decorCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gold + '06',
    right: -30,
    top: -30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gold + '04',
    right: 50,
    bottom: -20,
  },
  accountsScroll: { marginBottom: spacing.sm },
  accountCardWrap: { width: 210, marginRight: 12 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
  },
  seeAll: { color: colors.gold, fontSize: 14, fontWeight: '500', marginBottom: 14 },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
