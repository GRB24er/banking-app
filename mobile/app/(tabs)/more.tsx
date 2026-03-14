import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../stores/auth';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';

const bankingMenu = [
  { icon: 'receipt-outline' as const, label: 'Transaction History', route: '/transactions' },
  { icon: 'cash-outline' as const, label: 'Check Deposit', route: '/deposit' },
  { icon: 'stats-chart-outline' as const, label: 'Spending Analytics', route: null },
  { icon: 'document-text-outline' as const, label: 'Statements', route: null },
];

const settingsMenu = [
  { icon: 'person-outline' as const, label: 'Profile Settings', route: null },
  { icon: 'notifications-outline' as const, label: 'Notifications', route: null },
  { icon: 'shield-checkmark-outline' as const, label: 'Security & Privacy', route: null },
  { icon: 'finger-print' as const, label: 'Biometric Login', route: null },
];

const supportMenu = [
  { icon: 'chatbubble-ellipses-outline' as const, label: 'Live Chat Support', route: null },
  { icon: 'help-circle-outline' as const, label: 'Help Center', route: null },
  { icon: 'information-circle-outline' as const, label: 'About', route: null },
];

export default function More() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/sign-in'); } },
    ]);
  };

  const renderMenu = (items: typeof bankingMenu) => (
    <View style={styles.menu}>
      {items.map((item, idx) => (
        <TouchableOpacity
          key={item.label}
          style={[styles.menuItem, idx === items.length - 1 && { borderBottomWidth: 0 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            item.route ? router.push(item.route as any) : Alert.alert('Coming Soon', 'This feature is coming soon.');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.menuIconWrap}>
            <Ionicons name={item.icon} size={20} color={colors.gold} />
          </View>
          <Text style={styles.menuLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileWrap}>
          <LinearGradient
            colors={['#1C2030', '#141720']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                <Text style={styles.verifiedText}>Verified Account</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={18} color={colors.gold} />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <Text style={styles.sectionLabel}>Banking</Text>
        {renderMenu(bankingMenu)}

        <Text style={styles.sectionLabel}>Account Settings</Text>
        {renderMenu(settingsMenu)}

        <Text style={styles.sectionLabel}>Support</Text>
        {renderMenu(supportMenu)}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footerWrap}>
          <Image source={require('../../assets/icon.png')} style={styles.footerLogo} resizeMode="contain" />
          <Text style={styles.version}>Horizon Global Capital v2.0.0</Text>
          <Text style={styles.copyright}>Private Banking & Wealth Management</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  profileWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gold + '20',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.goldSubtle,
    borderWidth: 2,
    borderColor: colors.gold + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.gold, fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { color: colors.text, fontSize: 18, fontWeight: '600' },
  profileEmail: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { color: colors.success, fontSize: 11, fontWeight: '500' },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  menu: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border + '30',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '25',
    gap: 12,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.goldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '400' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error + '25',
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
  },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  footerWrap: { alignItems: 'center', marginTop: spacing.xl, marginBottom: 40 },
  footerLogo: { width: 36, height: 36, marginBottom: 8, opacity: 0.5 },
  version: { color: colors.textMuted, fontSize: 12 },
  copyright: { color: colors.textMuted, fontSize: 10, marginTop: 2, opacity: 0.6 },
});
