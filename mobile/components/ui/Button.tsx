import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, spacing, shadows } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style, size = 'md' }: ButtonProps) {
  const handlePress = () => {
    if (loading || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isDisabled = loading || disabled;
  const bg = variant === 'primary' ? colors.gold
    : variant === 'danger' ? colors.error
    : variant === 'secondary' ? colors.surfaceLight
    : 'transparent';
  const border = variant === 'outline' ? colors.gold
    : variant === 'secondary' ? colors.border
    : 'transparent';
  const textColor = variant === 'outline' || variant === 'ghost' ? colors.gold
    : variant === 'secondary' ? colors.text
    : variant === 'primary' ? colors.background
    : '#FFFFFF';
  const heights: Record<string, number> = { sm: 40, md: 52, lg: 58 };
  const fontSizes: Record<string, number> = { sm: 13, md: 16, lg: 17 };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: (variant === 'outline' || variant === 'secondary') ? 1.5 : 0,
          height: heights[size],
        },
        variant === 'primary' && !isDisabled && shadows.gold,
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor, fontSize: fontSizes[size] }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
