import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  progress,
  height = 8,
  color = '#58CC02',
  label,
  showPercentage = false,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clampedProgress}%`, { duration: 500 }),
  }));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[styles.fill, animatedStyle, { backgroundColor: color, height }]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.percentage}>{clampedProgress.toFixed(0)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  track: {
    width: '100%',
    backgroundColor: '#0F1419',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 999,
  },
  percentage: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
});
