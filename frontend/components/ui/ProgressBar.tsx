import { useTheme } from '@/hooks/useTheme';
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
  color,
  label,
  showPercentage = false,
}: ProgressBarProps) {
  const theme = useTheme();
  const barColor = color || theme.colors.secondary;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${clampedProgress}%`, { duration: 500 }),
  }));

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>}
      <View style={[styles.track, { height, backgroundColor: theme.colors.darkest }]}>
        <Animated.View
          style={[styles.fill, animatedStyle, { backgroundColor: barColor, height }]}
        />
      </View>
      {showPercentage && (
        <Text style={[styles.percentage, { color: theme.colors.textMuted }]}>{clampedProgress.toFixed(0)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: { fontSize: 12, marginBottom: 4 },
  track: { width: '100%', borderRadius: 999, overflow: 'hidden' },
  fill: { borderRadius: 999 },
  percentage: { fontSize: 11, marginTop: 4 },
});
