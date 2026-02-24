import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface TimeRingProps {
  allocated: number;
  spent: number;
  category: string;
}

export function TimeRing({
  allocated,
  spent,
  category,
}: TimeRingProps) {
  const percentage = Math.min((spent / allocated) * 100, 100);
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View className="items-center gap-md">
      <Svg width={120} height={120} viewBox="0 0 120 120">
        {/* Background circle */}
        <Circle
          cx={60}
          cy={60}
          r={45}
          stroke="#1A2C34"
          strokeWidth={8}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={60}
          cy={60}
          r={45}
          stroke="#58CC02"
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <View className="items-center">
        <Text className="text-2xl font-outfit font-bold text-primary">
          {spent}m
        </Text>
        <Text className="text-sm text-muted">of {allocated}m</Text>
        <Text className="text-xs text-muted mt-xs">{category}</Text>
      </View>
    </View>
  );
}
