import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const variantColors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
  };

  return (
    <View className={`${variantColors[variant]} rounded-full px-md py-xs`}>
      <Text className="text-white text-xs font-outfit font-semibold">
        {label}
      </Text>
    </View>
  );
}
