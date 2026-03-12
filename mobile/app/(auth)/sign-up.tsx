import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import { colors, spacing, borderRadius } from '../../constants/theme';

export default function SignUp() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    dob: '', nationality: '', idType: 'passport', idNumber: '', phone: '',
    address: '', city: '', postalCode: '', country: '', employmentStatus: '',
    monthlyIncome: '', purpose: 'personal',
  });

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        setError('All fields are required');
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (form.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
    }
    if (step === 2) {
      if (!form.dob || !form.phone) {
        setError('Date of birth and phone are required');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post(endpoints.auth.register, {
        name: `${form.firstName} ${form.lastName}`,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob,
        nationality: form.nationality,
        identificationType: form.idType,
        identificationNumber: form.idNumber,
        phone: form.phone,
        address: form.address,
        city: form.city,
        postalCode: form.postalCode,
        country: form.country,
        employmentStatus: form.employmentStatus,
        monthlyIncome: form.monthlyIncome,
        purpose: form.purpose,
      });
      if (res.success) {
        router.replace('/(auth)/sign-in');
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>Create Account</Text>
          <View style={styles.steps}>
            {[1, 2, 3].map(s => (
              <View key={s} style={[styles.stepDot, s <= step && styles.stepActive]} />
            ))}
          </View>
          <Text style={styles.stepLabel}>Step {step} of 3</Text>

          {error ? (
            <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
          ) : null}

          {step === 1 && (
            <>
              <Input label="First Name" value={form.firstName} onChangeText={v => update('firstName', v)} placeholder="John" />
              <Input label="Last Name" value={form.lastName} onChangeText={v => update('lastName', v)} placeholder="Doe" />
              <Input label="Email" value={form.email} onChangeText={v => update('email', v)} placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" />
              <Input label="Password" value={form.password} onChangeText={v => update('password', v)} placeholder="Min 8 characters" secureTextEntry />
              <Input label="Confirm Password" value={form.confirmPassword} onChangeText={v => update('confirmPassword', v)} placeholder="Re-enter password" secureTextEntry />
              <Button title="Next" onPress={handleNext} style={{ marginTop: 8 }} />
            </>
          )}

          {step === 2 && (
            <>
              <Input label="Date of Birth" value={form.dob} onChangeText={v => update('dob', v)} placeholder="YYYY-MM-DD" />
              <Input label="Nationality" value={form.nationality} onChangeText={v => update('nationality', v)} placeholder="e.g. US" />
              <Input label="ID Number" value={form.idNumber} onChangeText={v => update('idNumber', v)} placeholder="Passport or ID number" />
              <Input label="Phone Number" value={form.phone} onChangeText={v => update('phone', v)} placeholder="+1234567890" keyboardType="phone-pad" />
              <View style={styles.row}>
                <Button title="Back" onPress={() => setStep(1)} variant="secondary" style={{ flex: 1, marginRight: 8 }} />
                <Button title="Next" onPress={handleNext} style={{ flex: 1 }} />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Input label="Address" value={form.address} onChangeText={v => update('address', v)} placeholder="123 Main St" />
              <Input label="City" value={form.city} onChangeText={v => update('city', v)} placeholder="New York" />
              <Input label="Postal Code" value={form.postalCode} onChangeText={v => update('postalCode', v)} placeholder="10001" />
              <Input label="Country" value={form.country} onChangeText={v => update('country', v)} placeholder="United States" />
              <Input label="Employment Status" value={form.employmentStatus} onChangeText={v => update('employmentStatus', v)} placeholder="Employed / Self-employed" />
              <Input label="Monthly Income" value={form.monthlyIncome} onChangeText={v => update('monthlyIncome', v)} placeholder="e.g. $5,000 - $10,000" />
              <View style={styles.row}>
                <Button title="Back" onPress={() => setStep(2)} variant="secondary" style={{ flex: 1, marginRight: 8 }} />
                <Button title="Create Account" onPress={handleSubmit} loading={loading} style={{ flex: 1 }} />
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Text style={styles.link} onPress={() => router.push('/(auth)/sign-in')}>Sign In</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg },
  logo: { color: colors.gold, fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: spacing.xl },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  stepDot: { width: 32, height: 4, backgroundColor: colors.border, borderRadius: 2 },
  stepActive: { backgroundColor: colors.gold },
  stepLabel: { color: colors.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24, fontSize: 13 },
  errorBox: { backgroundColor: colors.error + '20', borderRadius: 8, padding: 12, marginBottom: spacing.md },
  errorText: { color: colors.error, fontSize: 14 },
  row: { flexDirection: 'row', marginTop: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, marginBottom: 40 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.gold, fontSize: 14, fontWeight: '600' },
});
