import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { Deposit } from '../../types';

const accountTypes = ['checking', 'savings'];

export default function CheckDeposit() {
  const router = useRouter();
  const [accountType, setAccountType] = useState('checking');
  const [amount, setAmount] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeposits = async () => {
    const res = await api.get<{ deposits: Deposit[] }>(endpoints.deposits);
    if (res.success) setDeposits(res.deposits || []);
  };

  useFocusEffect(useCallback(() => { fetchDeposits(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeposits();
    setRefreshing(false);
  };

  const pickImage = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (side === 'front') setFrontImage(base64);
      else setBackImage(base64);
    }
  };

  const pickFromGallery = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (side === 'front') setFrontImage(base64);
      else setBackImage(base64);
    }
  };

  const showImageOptions = (side: 'front' | 'back') => {
    Alert.alert('Select Image', 'Choose how to capture the check', [
      { text: 'Camera', onPress: () => pickImage(side) },
      { text: 'Gallery', onPress: () => pickFromGallery(side) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!frontImage || !backImage) {
      Alert.alert('Error', 'Please capture both front and back of the check');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(endpoints.deposits, {
        amount: parseFloat(amount),
        accountType,
        checkFrontImage: frontImage,
        checkBackImage: backImage,
      });
      if (res.success) {
        Alert.alert('Success', 'Check deposit submitted for review', [
          { text: 'OK', onPress: () => {
            setAmount('');
            setFrontImage(null);
            setBackImage(null);
            fetchDeposits();
          }},
        ]);
      } else {
        Alert.alert('Error', res.message || 'Deposit failed');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'approved') return colors.success;
    if (s === 'rejected') return colors.error;
    return colors.warning;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Check Deposit</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
      >
        <Text style={styles.label}>Deposit To</Text>
        <View style={styles.pickerRow}>
          {accountTypes.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.accountChip, accountType === a && styles.accountChipActive]}
              onPress={() => setAccountType(a)}
            >
              <Text style={[styles.chipText, accountType === a && styles.chipTextActive]}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Check Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Check Front</Text>
        <TouchableOpacity style={styles.imageBox} onPress={() => showImageOptions('front')}>
          {frontImage ? (
            <Image source={{ uri: frontImage }} style={styles.preview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={32} color={colors.textMuted} />
              <Text style={styles.imagePlaceholderText}>Tap to capture front of check</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Check Back</Text>
        <TouchableOpacity style={styles.imageBox} onPress={() => showImageOptions('back')}>
          {backImage ? (
            <Image source={{ uri: backImage }} style={styles.preview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={32} color={colors.textMuted} />
              <Text style={styles.imagePlaceholderText}>Tap to capture back of check</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: spacing.lg }} />
        <Button title="Submit Deposit" onPress={submit} loading={loading} />

        {deposits.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>Deposit History</Text>
            {deposits.map(d => (
              <View key={d._id} style={styles.depositItem}>
                <View>
                  <Text style={styles.depositAmount}>
                    ${d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.depositDate}>
                    {new Date(d.createdAt).toLocaleDateString()} · {d.accountType}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(d.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColor(d.status) }]}>
                    {d.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 20, fontWeight: '700' },
  content: { padding: spacing.lg, paddingTop: 0 },
  label: { color: colors.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  pickerRow: { flexDirection: 'row', gap: 8 },
  accountChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  accountChipActive: { backgroundColor: colors.gold + '20', borderColor: colors.gold },
  chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: colors.gold, fontWeight: '600' },
  imageBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    height: 160,
  },
  preview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: { color: colors.textMuted, fontSize: 13 },
  historySection: { marginTop: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600', marginBottom: 12 },
  depositItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  depositAmount: { color: colors.text, fontSize: 16, fontWeight: '600' },
  depositDate: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
});
