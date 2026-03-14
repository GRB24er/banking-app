import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../stores/auth';
import AccountCard from '../../components/AccountCard';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

export default function Accounts() {
  const { user } = useAuth();
  const router = useRouter();
  const totalBalance = (user?.checkingBalance || 0) + (user?.savingsBalance || 0) + (user?.investmentBalance || 0);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>My Accounts</Text>
          <Text style={styles.subtitle}>Manage your accounts and balances</Text>
        </View>

        {/* Total Balance Card */}
        <View style={styles.totalWrap}>
          <LinearGradient
            colors={['#1C2030', '#141720']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.totalCard}
          >
            <Text style={styles.totalLabel}>Total Net Worth</Text>
            <Text style={styles.totalAmount}>
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={styles.totalSub}>Across all accounts</Text>
          </LinearGradient>
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
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={colors.gold} />
            <Text style={styles.infoTitle}>Account Details</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Number</Text>
            <TouchableOpacity
              style={styles.copyRow}
              onPress={() => copyToClipboard(user?.accountNumber || '')}
              activeOpacity={0.7}
            >
              <Text style={styles.infoValue}>{user?.accountNumber || '\u2014'}</Text>
              <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Routing Number</Text>
            <TouchableOpacity
              style={styles.copyRow}
              onPress={() => copyToClipboard(user?.routingNumber || '')}
              activeOpacity={0.7}
            >
              <Text style={styles.infoValue}>{user?.routingNumber || '\u2014'}</Text>
              <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Account Holder</Text>
            <Text style={styles.infoValue}>{user?.name || '\u2014'}</Text>
          </View>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 4 },
  totalWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  totalCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gold + '20',
    alignItems: 'center',
  },
  totalLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 4 },
  totalAmount: { color: colors.gold, fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  totalSub: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  content: { paddingHorizontal: spacing.lg },
  infoCard: {
    margin: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  infoTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '30',
  },
  infoLabel: { color: colors.textSecondary, fontSize: 14 },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '500' },
  copyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
