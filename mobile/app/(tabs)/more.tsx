import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../stores/auth';
import { colors, spacing, borderRadius } from '../../constants/theme';

const menuItems = [
  { icon: 'receipt-outline' as const, label: 'Transaction History', route: '/transactions' },
  { icon: 'cash-outline' as const, label: 'Check Deposit', route: '/deposit' },
  { icon: 'shield-checkmark-outline' as const, label: 'Security', route: null },
  { icon: 'help-circle-outline' as const, label: 'Help & Support', route: null },
  { icon: 'information-circle-outline' as const, label: 'About', route: null },
];

export default function More() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/sign-in'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => item.route ? router.push(item.route as any) : Alert.alert('Coming Soon', 'This feature is coming soon.')}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Horizon Global Capital v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.gold + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.gold, fontSize: 18, fontWeight: '700' },
  profileName: { color: colors.text, fontSize: 17, fontWeight: '600' },
  profileEmail: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  menu: { marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
    gap: 12,
  },
  menuLabel: { flex: 1, color: colors.text, fontSize: 16 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  logoutText: { color: colors.error, fontSize: 16, fontWeight: '500' },
  version: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, fontSize: 12 },
});
