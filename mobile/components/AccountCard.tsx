import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';

interface AccountCardProps {
  type: 'checking' | 'savings' | 'investment';
  balance: number;
  accountNumber?: string;
  onPress?: () => void;
}

const accountConfig = {
  checking: {
    icon: 'wallet-outline' as const,
    label: 'Checking',
    gradient: ['#6366F1', '#4F46E5'] as [string, string],
    accent: '#818CF8',
  },
  savings: {
    icon: 'leaf-outline' as const,
    label: 'Savings',
    gradient: ['#10B981', '#059669'] as [string, string],
    accent: '#34D399',
  },
  investment: {
    icon: 'trending-up-outline' as const,
    label: 'Investment',
    gradient: ['#F59E0B', '#D97706'] as [string, string],
    accent: '#FBBF24',
  },
};

export default function AccountCard({ type, balance, accountNumber, onPress }: AccountCardProps) {
  const config = accountConfig[type];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.wrapper}>
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name={config.icon} size={18} color="#fff" />
          </View>
          <Text style={styles.label}>{config.label}</Text>
        </View>
        <Text style={styles.balance}>
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
        {accountNumber && (
          <Text style={styles.account}>•••• {accountNumber.slice(-4)}</Text>
        )}
        <View style={[styles.circle, { backgroundColor: config.accent + '20' }]} />
        <View style={[styles.circleSmall, { backgroundColor: config.accent + '15' }]} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
    ...shadows.md,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 130,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  account: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 1,
  },
  circle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    right: -20,
    top: -20,
  },
  circleSmall: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    right: 40,
    bottom: -10,
  },
});
