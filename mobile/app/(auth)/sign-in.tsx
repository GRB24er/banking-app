import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAuth } from '../../stores/auth';
import api from '../../services/api';
import { endpoints } from '../../constants/api';
import { colors, spacing } from '../../constants/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.post<{ token: string; user: any }>(endpoints.auth.login, {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (res.success && res.token) {
        await login(res.token, res.user);
        router.replace('/(tabs)');
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (e: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>Horizon Global Capital</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: 8 }} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Text style={styles.link} onPress={() => router.push('/(auth)/sign-up')}>
              Sign Up
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { color: colors.gold, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 16, marginTop: 8 },
  errorBox: {
    backgroundColor: colors.error + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.error, fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: colors.gold, fontSize: 14, fontWeight: '600' },
});
