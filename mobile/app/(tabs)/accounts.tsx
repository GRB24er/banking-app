import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/auth';
import AccountCard from '../../components/AccountCard';
import { colors, spacing } from '../../constants/theme';

export default function Accounts() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Accounts</Text>
          <Text style={styles.subtitle}>Manage your accounts</Text>
        </View>
        <View style={styles.content}>
          <AccountCard
            type="checking"
            balance={user?.checkingBalance || 0}
            accountNumber={user?.accountNumber}
            onPress={() => router.push('/accounts/checking')}
          />
          <AccountCard
            type="savings"
            balance={user?.savingsBalance || 0}
            accountNumber={user?.accountNumber}
            onPress={() => router.push('/accounts/savings')}
          />
          <AccountCard
            type="investment"
            balance={user?.investmentBalance || 0}
            onPress={() => router.push('/accounts/investment')}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Account Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <Text style={styles.infoValue}>{user?.accountNumber || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Routing Number</Text>
            <Text style={styles.infoValue}>{user?.routingNumber || '—'}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  content: { paddingHorizontal: spacing.lg },
  infoCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoTitle: { color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  infoLabel: { color: colors.textSecondary, fontSize: 14 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '500' },
});
