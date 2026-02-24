import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
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
        withTiming(1.1, { duration: 1000 }),
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
    <View className="items-center">
      <Animated.Text
        style={animatedStyle}
        className="text-5xl mb-sm"
      >
        🔥
      </Animated.Text>
      <View className="bg-accent rounded-full px-md py-xs">
        <Text className="text-white text-lg font-outfit font-bold">
          {count} day streak
        </Text>
      </View>
      {isFrozen && (
        <Text className="text-warning text-xs mt-sm font-outfit">
          Streak frozen ❄️
        </Text>
      )}
    </View>
  );
}
