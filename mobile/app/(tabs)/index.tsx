import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../stores/auth';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import { colors, spacing, borderRadius } from '../../constants/theme';
import AccountCard from '../../components/AccountCard';
import TransactionItem from '../../components/TransactionItem';
import { Transaction } from '../../types';
import { useFocusEffect } from 'expo-router';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [_, txRes] = await Promise.all([
        refreshUser(),
        api.get<{ transactions: Transaction[] }>(`${endpoints.transactions}?limit=10`),
      ]);
      if (txRes.success) setTransactions(txRes.transactions);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
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
    { icon: 'swap-horizontal' as const, label: 'Transfer', route: '/(tabs)/transfers' },
    { icon: 'cash' as const, label: 'Deposit', route: '/deposit' },
    { icon: 'card' as const, label: 'Cards', route: '/(tabs)/cards' },
    { icon: 'document-text' as const, label: 'History', route: '/transactions' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name}>{user?.firstName || 'User'}</Text>
          </View>
          <View style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionItem}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={22} color={colors.gold} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No recent transactions</Text>
            </View>
          ) : (
            transactions.map(tx => <TransactionItem key={tx._id} item={tx} />)
          )}
        </View>
        <View style={{ height: 20 }} />
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
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  greeting: { color: colors.textSecondary, fontSize: 14 },
  name: { color: colors.text, fontSize: 22, fontWeight: '700' },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold + '30',
    marginBottom: spacing.md,
  },
  balanceLabel: { color: colors.textSecondary, fontSize: 14 },
  balanceAmount: { color: colors.gold, fontSize: 32, fontWeight: '700', marginTop: 4 },
  accountsScroll: { marginBottom: spacing.md },
  accountCardWrap: { width: 200, marginRight: 12 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  seeAll: { color: colors.gold, fontSize: 14, fontWeight: '500' },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: { color: colors.textSecondary, fontSize: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 8 },
});
