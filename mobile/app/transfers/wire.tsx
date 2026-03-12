import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors, spacing, borderRadius } from '../../constants/theme';

const accounts = ['checking', 'savings', 'investment'];

export default function WireTransfer() {
  const router = useRouter();
  const [fromAccount, setFromAccount] = useState('checking');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [recipientRouting, setRecipientRouting] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!recipientName || !recipientAccount || !recipientBank || !recipientRouting) {
      Alert.alert('Error', 'Please fill in all recipient details');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(endpoints.transfers, {
        type: 'wire',
        fromAccount,
        recipientName,
        recipientAccount,
        recipientBank,
        recipientRoutingNumber: recipientRouting,
        amount: parseFloat(amount),
        description: description || 'Wire transfer',
      });
      if (res.success) {
        Alert.alert('Success', 'Wire transfer submitted successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Error', res.message || 'Transfer failed');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Wire Transfer</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>From Account</Text>
        <View style={styles.pickerRow}>
          {accounts.map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.accountChip, fromAccount === a && styles.accountChipActive]}
              onPress={() => setFromAccount(a)}
            >
              <Text style={[styles.chipText, fromAccount === a && styles.chipTextActive]}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Recipient Details</Text>

        <Input label="Recipient Name" placeholder="Full name" value={recipientName} onChangeText={setRecipientName} />
        <Input label="Account Number" placeholder="Account number" value={recipientAccount} onChangeText={setRecipientAccount} keyboardType="number-pad" />
        <Input label="Bank Name" placeholder="Recipient's bank" value={recipientBank} onChangeText={setRecipientBank} />
        <Input label="Routing Number" placeholder="9-digit routing number" value={recipientRouting} onChangeText={setRecipientRouting} keyboardType="number-pad" />
        <Input label="Amount" placeholder="0.00" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
        <Input label="Description (optional)" placeholder="What's this for?" value={description} onChangeText={setDescription} />

        <View style={{ height: spacing.lg }} />
        <Button title="Send Wire Transfer" onPress={submit} loading={loading} />
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
  sectionLabel: { color: colors.gold, fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 4 },
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
});
