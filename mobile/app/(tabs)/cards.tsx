import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import { colors, spacing, borderRadius, shadows } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { Card } from '../../types';

const { width } = Dimensions.get('window');

export default function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const fetchCards = async () => {
    try {
      const res = await api.get<{ cards: Card[] }>(endpoints.cards);
      if (res.success) setCards(res.cards || []);
    } catch (err) {
      console.warn('Failed to fetch cards:', err);
    }
  };

  useFocusEffect(useCallback(() => { fetchCards(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCards();
    setRefreshing(false);
  };

  const requestCard = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRequesting(true);
    try {
      const res = await api.post(endpoints.cards, { cardType: 'debit' });
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', res.message || 'Card requested successfully');
        fetchCards();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', res.error || 'Failed to request card');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setRequesting(false);
  };

  const handleAction = (action: string, card: Card) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(action, `${action} action for card ending ${card.maskedNumber?.slice(-4)}`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Cards</Text>
          <Text style={styles.subtitle}>Manage your debit and virtual cards</Text>
        </View>

        {cards.map((card, index) => (
          <View key={card._id} style={styles.cardContainer}>
            <LinearGradient
              colors={index % 2 === 0 ? ['#0B0D11', '#1A1D2E', '#0B0D11'] : ['#1A1510', '#2A2015', '#1A1510']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardVisual}
            >
              {/* Gold border accent */}
              <View style={styles.cardBorder} />

              {card.status === 'frozen' && (
                <View style={styles.frozenOverlay}>
                  <Ionicons name="snow" size={24} color="#fff" />
                  <Text style={styles.frozenText}>FROZEN</Text>
                </View>
              )}

              {/* Card Top */}
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.bankName}>HORIZON GLOBAL CAPITAL</Text>
                  <Text style={styles.cardType}>{card.type?.toUpperCase() || 'DEBIT'} CARD</Text>
                </View>
                <Text style={styles.cardNetwork}>{card.network?.toUpperCase() || 'VISA'}</Text>
              </View>

              {/* Chip */}
              <View style={styles.chipContainer}>
                <View style={styles.chip}>
                  <View style={styles.chipLine} />
                  <View style={styles.chipLine} />
                  <View style={styles.chipLine} />
                </View>
                <View style={styles.contactless}>
                  <Ionicons name="wifi" size={16} color={colors.gold + '80'} style={{ transform: [{ rotate: '90deg' }] }} />
                </View>
              </View>

              {/* Card Number */}
              <Text style={styles.cardNumber}>{card.maskedNumber || '**** **** **** ****'}</Text>

              {/* Card Bottom */}
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardValue}>{card.cardHolder?.toUpperCase()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cardLabel}>VALID THRU</Text>
                  <Text style={styles.cardValue}>{card.expiryDate}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Card Actions */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleAction(card.status === 'frozen' ? 'Unfreeze' : 'Freeze', card)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, card.status === 'frozen' && { backgroundColor: colors.info + '20' }]}>
                  <Ionicons name={card.status === 'frozen' ? 'play' : 'snow'} size={18} color={card.status === 'frozen' ? colors.info : colors.gold} />
                </View>
                <Text style={styles.actionText}>{card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('Details', card)} activeOpacity={0.7}>
                <View style={styles.actionIcon}>
                  <Ionicons name="eye-outline" size={18} color={colors.gold} />
                </View>
                <Text style={styles.actionText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('Settings', card)} activeOpacity={0.7}>
                <View style={styles.actionIcon}>
                  <Ionicons name="settings-outline" size={18} color={colors.gold} />
                </View>
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleAction('Report', card)} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
                </View>
                <Text style={[styles.actionText, { color: colors.error }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {cards.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="card-outline" size={40} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>No Cards Yet</Text>
            <Text style={styles.emptyText}>Request your first Horizon Global Capital card to get started</Text>
          </View>
        )}

        <View style={styles.section}>
          <Button title="Request New Card" onPress={requestCard} loading={requesting} size="lg" />
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
  cardContainer: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  cardVisual: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    height: 210,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  cardBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gold + '25',
  },
  frozenOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(59,130,246,0.35)',
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  frozenText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bankName: { color: colors.gold, fontSize: 10, fontWeight: '600', letterSpacing: 2 },
  cardType: { color: colors.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 1 },
  cardNetwork: { color: colors.gold, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  chipContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chip: {
    width: 40,
    height: 28,
    borderRadius: 5,
    backgroundColor: colors.gold,
    padding: 4,
    justifyContent: 'space-between',
  },
  chipLine: { width: '100%', height: 2, backgroundColor: colors.gold + 'AA', borderRadius: 1 },
  contactless: { opacity: 0.6 },
  cardNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { color: colors.textMuted, fontSize: 8, letterSpacing: 1 },
  cardValue: { color: colors.text, fontSize: 12, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border + '30',
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.goldSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
});
