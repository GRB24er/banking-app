import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width = '100%', height = 20, borderRadius: br = borderRadius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: br,
          backgroundColor: colors.surfaceLight,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      <View style={skeletonStyles.header}>
        <View>
          <Skeleton width={120} height={14} />
          <Skeleton width={160} height={24} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={42} height={42} borderRadius={21} />
      </View>
      <Skeleton width="100%" height={100} borderRadius={16} style={{ marginHorizontal: 24, marginBottom: 16 }} />
      <View style={skeletonStyles.cardsRow}>
        <Skeleton width={200} height={120} borderRadius={12} />
        <Skeleton width={200} height={120} borderRadius={12} />
      </View>
      <View style={skeletonStyles.section}>
        <Skeleton width={120} height={18} />
        <View style={skeletonStyles.actionsRow}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={skeletonStyles.actionItem}>
              <Skeleton width={52} height={52} borderRadius={26} />
              <Skeleton width={48} height={12} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>
      <View style={skeletonStyles.section}>
        <Skeleton width={140} height={18} />
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={skeletonStyles.txRow}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton width="70%" height={14} />
              <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
            </View>
            <Skeleton width={80} height={16} />
          </View>
        ))}
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  cardsRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 12, marginBottom: 16 },
  section: { paddingHorizontal: 24, marginBottom: 16 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  actionItem: { alignItems: 'center' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
});
