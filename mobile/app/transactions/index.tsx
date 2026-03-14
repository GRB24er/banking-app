import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import TransactionItem from '../../components/TransactionItem';
import { colors, spacing } from '../../constants/theme';
import { Transaction } from '../../types';

const filters = ['all', 'deposit', 'withdrawal', 'transfer-out', 'transfer-in', 'fee'];

export default function Transactions() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTx = async (p = 1, f = filter) => {
    try {
      const typeParam = f === 'all' ? '' : `&type=${f}`;
      const res = await api.get<{ transactions: Transaction[]; pagination: any }>(
        `${endpoints.transactions}?limit=20&page=${p}${typeParam}`
      );
      if (res.success) {
        if (p === 1) setTransactions(res.transactions);
        else setTransactions(prev => [...prev, ...res.transactions]);
        setHasMore(res.pagination?.hasMore || false);
        setPage(p);
      }
    } catch (err) { console.warn('Request failed:', err); }
  };

  useFocusEffect(useCallback(() => { fetchTx(1); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTx(1);
    setRefreshing(false);
  };

  const onFilter = (f: string) => {
    setFilter(f);
    fetchTx(1, f);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <FlatList
        horizontal
        data={filters}
        keyExtractor={f => f}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === f && styles.filterActive]}
            onPress={() => onFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.replace('-', ' ')}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      />

      <FlatList
        data={transactions}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.txWrap}><TransactionItem item={item} /></View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        onEndReached={() => hasMore && fetchTx(page + 1)}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={<Text style={styles.emptyText}>No transactions found</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  filters: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.gold + '20', borderColor: colors.gold },
  filterText: { color: colors.textSecondary, fontSize: 13, textTransform: 'capitalize' },
  filterTextActive: { color: colors.gold, fontWeight: '600' },
  txWrap: { paddingHorizontal: spacing.lg },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: 40 },
});
