import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import { colors, spacing, borderRadius } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { Card } from '../../types';

export default function Cards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const fetchCards = async () => {
    const res = await api.get<{ cards: Card[] }>(endpoints.cards);
    if (res.success) setCards(res.cards || []);
  };

  useFocusEffect(useCallback(() => { fetchCards(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCards();
    setRefreshing(false);
  };

  const requestCard = async () => {
    setRequesting(true);
    const res = await api.post(endpoints.cards, { cardType: 'debit' });
    if (res.success) {
      Alert.alert('Success', res.message || 'Card requested successfully');
      fetchCards();
    } else {
      Alert.alert('Error', res.error || 'Failed to request card');
    }
    setRequesting(false);
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

        {cards.map(card => (
          <View key={card._id} style={styles.cardContainer}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e', '#0f3460']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardVisual}
            >
              {card.status === 'frozen' && (
                <View style={styles.frozenOverlay}>
                  <Ionicons name="snow" size={20} color="#fff" />
                  <Text style={styles.frozenText}>FROZEN</Text>
                </View>
              )}
              <View style={styles.cardTop}>
                <Text style={styles.cardType}>{card.type.toUpperCase()}</Text>
                <Text style={styles.cardNetwork}>{card.network?.toUpperCase() || 'VISA'}</Text>
              </View>
              <Text style={styles.cardNumber}>{card.maskedNumber}</Text>
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.cardLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardValue}>{card.cardHolder}</Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRES</Text>
                  <Text style={styles.cardValue}>{card.expiryDate}</Text>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name={card.status === 'frozen' ? 'play' : 'snow'} size={18} color={colors.gold} />
                <Text style={styles.actionText}>{card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="eye" size={18} color={colors.gold} />
                <Text style={styles.actionText}>Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {cards.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No cards yet</Text>
          </View>
        )}

        <View style={styles.section}>
          <Button title="Request New Card" onPress={requestCard} loading={requesting} />
        </View>
        <View style={{ height: 20 }} />
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    height: 200,
    justifyContent: 'space-between',
  },
  frozenOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(59,130,246,0.4)',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  frozenText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  cardType: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  cardNetwork: { color: colors.gold, fontSize: 14, fontWeight: '700' },
  cardNumber: { color: colors.text, fontSize: 20, fontWeight: '600', letterSpacing: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { color: colors.textMuted, fontSize: 10 },
  cardValue: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 2 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionText: { color: colors.textSecondary, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: colors.textMuted, marginTop: 12 },
  section: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
});
