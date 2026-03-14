import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../stores/auth';
import { colors } from '../constants/theme';

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 600,
      delay: 400,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/sign-in');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated]);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <LinearGradient colors={['#0B0D11', '#141720', '#0B0D11']} style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[styles.textWrap, { opacity: textOpacity }]}>
        <Text style={styles.title}>HORIZON</Text>
        <Animated.View style={[styles.goldLine, { opacity: shimmerOpacity }]} />
        <Text style={styles.subtitle}>GLOBAL CAPITAL</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: textOpacity }]}>
        <Text style={styles.footerText}>Private Banking & Wealth Management</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { width: 100, height: 100, marginBottom: 24 },
  logo: { width: 100, height: 100 },
  textWrap: { alignItems: 'center' },
  title: { color: colors.gold, fontSize: 28, fontWeight: '700', letterSpacing: 6 },
  goldLine: { width: 60, height: 2, backgroundColor: colors.gold, marginVertical: 10, borderRadius: 1 },
  subtitle: { color: colors.textSecondary, fontSize: 14, fontWeight: '500', letterSpacing: 4 },
  footer: { position: 'absolute', bottom: 60 },
  footerText: { color: colors.textMuted, fontSize: 12, letterSpacing: 0.5 },
});
