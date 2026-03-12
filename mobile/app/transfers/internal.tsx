import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { colors, spacing, borderRadius } from '../../constants/theme';

const accounts = ['checking', 'savings', 'investment'];

export default function InternalTransfer() {
  const router = useRouter();
  const [fromAccount, setFromAccount] = useState('checking');
  const [toAccount, setToAccount] = useState('savings');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (fromAccount === toAccount) {
      Alert.alert('Error', 'From and To accounts must be different');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(endpoints.transfers, {
        type: 'internal',
        fromAccount,
        toAccount,
        amount: parseFloat(amount),
        description: description || 'Internal transfer',
      });
      if (res.success) {
        Alert.alert('Success', 'Transfer completed successfully', [
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
        <Text style={styles.title}>Between Accounts</Text>
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

        <Text style={styles.label}>To Account</Text>
        <View style={styles.pickerRow}>
          {accounts.filter(a => a !== fromAccount).map(a => (
            <TouchableOpacity
              key={a}
              style={[styles.accountChip, toAccount === a && styles.accountChipActive]}
              onPress={() => setToAccount(a)}
            >
              <Text style={[styles.chipText, toAccount === a && styles.chipTextActive]}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Input
          label="Description (optional)"
          placeholder="What's this for?"
          value={description}
          onChangeText={setDescription}
        />

        <View style={{ height: spacing.lg }} />
        <Button title="Transfer Now" onPress={submit} loading={loading} />
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
});
