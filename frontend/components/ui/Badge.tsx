import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const theme = useTheme();
  const c = theme.colors;

  const variantColors: Record<string, { bg: string; text: string }> = {
    primary: { bg: c.primaryMuted, text: c.primary },
    success: { bg: c.successBg, text: c.success },
    warning: { bg: c.warningBg, text: c.warning },
    error: { bg: c.errorBg, text: c.error },
  };

  const colors = variantColors[variant] || variantColors.primary;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
