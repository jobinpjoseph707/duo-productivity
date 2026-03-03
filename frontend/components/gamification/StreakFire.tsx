import { useTheme } from '@/hooks/useTheme';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface StreakFireProps {
  count: number;
  isFrozen?: boolean;
}

export function StreakFire({ count, isFrozen = false }: StreakFireProps) {
  const theme = useTheme();
  const c = theme.colors;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!isFrozen) {
      scale.value = withRepeat(
        withTiming(1.15, { duration: 800 }),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [isFrozen, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.fireEmoji, animatedStyle]}>
        🔥
      </Animated.Text>
      <Text style={[styles.countText, { color: c.accent }]}>{count}</Text>
      <Text style={[styles.label, { color: c.textSecondary }]}>day streak</Text>
      {isFrozen && (
        <View style={[styles.frozenBadge, { backgroundColor: c.secondaryMuted }]}>
          <Text style={[styles.frozenText, { color: c.secondary }]}>❄️ Frozen</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  fireEmoji: { fontSize: 48, marginBottom: 8 },
  countText: { fontSize: 36, fontWeight: '800' },
  label: { fontSize: 14, marginTop: 2 },
  frozenBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frozenText: { fontSize: 12, fontWeight: '600' },
});
