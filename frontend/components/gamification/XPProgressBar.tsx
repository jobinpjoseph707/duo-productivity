import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
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
  const theme = useTheme();
  const c = theme.colors;
  const progress = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.levelBadge, { backgroundColor: c.primaryMuted }]}>
          <Text style={[styles.levelText, { color: c.primary }]}>Lv. {level}</Text>
        </View>
        <Text style={[styles.xpText, { color: c.textMuted }]}>
          {currentXP} / {nextLevelXP} XP
        </Text>
      </View>
      <ProgressBar
        progress={progress}
        color={c.secondary}
        height={12}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  levelText: { fontSize: 16, fontWeight: '700' },
  xpText: { fontSize: 13 },
});
