import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

const variantColors: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'rgba(88, 204, 2, 0.15)', text: '#58CC02' },
  success: { bg: 'rgba(88, 204, 2, 0.15)', text: '#58CC02' },
  warning: { bg: 'rgba(255, 150, 0, 0.15)', text: '#FF9600' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444' },
};

export function Badge({ label, variant = 'primary' }: BadgeProps) {
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
