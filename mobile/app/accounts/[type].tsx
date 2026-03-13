import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../stores/auth';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import TransactionItem from '../../components/TransactionItem';
import { colors, spacing } from '../../constants/theme';
import { Transaction } from '../../types';

const accountMeta: Record<string, { color: string; label: string }> = {
  checking: { color: colors.checking, label: 'Checking Account' },
  savings: { color: colors.savings, label: 'Savings Account' },
  investment: { color: colors.investment, label: 'Investment Account' },
};

export default function AccountDetail() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const meta = accountMeta[type || 'checking'];
  const balance = user ? (user as any)[`${type}Balance`] || 0 : 0;

  const fetchTransactions = async (p = 1) => {
    try {
      const res = await api.get<{ transactions: Transaction[]; pagination: any }>(
        `${endpoints.transactions}?limit=20&page=${p}&accountType=${type}`
      );
      if (res.success) {
        if (p === 1) setTransactions(res.transactions);
        else setTransactions(prev => [...prev, ...res.transactions]);
        setHasMore(res.pagination?.hasMore || false);
        setPage(p);
      }
    } catch {}
  };

  useFocusEffect(useCallback(() => { fetchTransactions(1); }, [type]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(1);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{meta?.label || 'Account'}</Text>
      </View>

      <View style={[styles.balanceCard, { borderLeftColor: meta?.color }]}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
      </View>

      <Text style={styles.sectionTitle}>Transactions</Text>
      <FlatList
        data={transactions}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.txWrap}><TransactionItem item={item} /></View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        onEndReached={() => hasMore && fetchTransactions(page + 1)}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions for this account</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  balanceCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderLeftWidth: 4,
    marginBottom: spacing.md,
  },
  balanceLabel: { color: colors.textSecondary, fontSize: 14 },
  balanceAmount: { color: colors.text, fontSize: 28, fontWeight: '700', marginTop: 4 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginLeft: spacing.lg, marginBottom: 8 },
  txWrap: { paddingHorizontal: spacing.lg },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: 40 },
});
