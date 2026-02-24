import React from 'react';
import { View, Text } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface XPProgressBarProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
}

export function XPProgressBar({
  currentXP,
  nextLevelXP,
  level,
}: XPProgressBarProps) {
  const progress = (currentXP / nextLevelXP) * 100;

  return (
    <View className="gap-sm">
      <View className="flex-row justify-between items-center">
        <Text className="text-primary font-outfit font-bold text-lg">
          Level {level}
        </Text>
        <Text className="text-muted text-sm">
          {currentXP} / {nextLevelXP} XP
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color="#58CC02"
        height={12}
      />
    </View>
  );
}
