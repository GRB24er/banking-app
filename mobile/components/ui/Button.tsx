import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const bg = variant === 'primary' ? colors.gold : variant === 'danger' ? colors.error : 'transparent';
  const border = variant === 'secondary' ? colors.gold : 'transparent';
  const textColor = variant === 'secondary' ? colors.gold : '#fff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.button,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === 'secondary' ? 1.5 : 0 },
        (loading || disabled) && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
