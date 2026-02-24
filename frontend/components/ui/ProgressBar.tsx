import React from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  label?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  color = '#58CC02',
  label,
}: ProgressBarProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${Math.min(progress, 100)}%`, { duration: 500 }),
  }));

  return (
    <View className="w-full">
      {label && <Text className="text-sm text-muted mb-xs">{label}</Text>}
      <View className="w-full bg-dark rounded-full overflow-hidden" style={{ height }}>
        <Animated.View
          style={[animatedStyle, { backgroundColor: color, height }]}
        />
      </View>
      <Text className="text-xs text-muted mt-xs">{progress.toFixed(0)}%</Text>
    </View>
  );
}
