import { ProgressBar } from '@/components/ui/ProgressBar';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
  const progress = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv. {level}</Text>
        </View>
        <Text style={styles.xpText}>
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

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: 'rgba(88, 204, 2, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#58CC02',
    fontSize: 16,
    fontWeight: '700',
  },
  xpText: {
    color: '#6B7280',
    fontSize: 13,
  },
});
