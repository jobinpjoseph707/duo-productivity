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
      <Text style={styles.countText}>{count}</Text>
      <Text style={styles.label}>day streak</Text>
      {isFrozen && (
        <View style={styles.frozenBadge}>
          <Text style={styles.frozenText}>❄️ Frozen</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  fireEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  countText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FF9600',
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  frozenBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  frozenText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
});
