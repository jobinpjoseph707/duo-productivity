import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface TimeRingProps {
  allocated: number;
  spent: number;
  category: string;
}

export function TimeRing({ allocated, spent, category }: TimeRingProps) {
  const theme = useTheme();
  const c = theme.colors;
  const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        <Circle cx={60} cy={60} r={45} stroke={c.border} strokeWidth={8} fill="none" />
        <Circle cx={60} cy={60} r={45} stroke={c.primary} strokeWidth={8} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} fill="none" strokeLinecap="round" transform="rotate(-90 60 60)" />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={[styles.spentText, { color: c.primary }]}>{spent}m</Text>
        <Text style={[styles.allocatedText, { color: c.textMuted }]}>of {allocated}m</Text>
        <Text style={[styles.categoryText, { color: c.textSecondary }]}>{category}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  labelContainer: { alignItems: 'center' },
  spentText: { fontSize: 22, fontWeight: '800' },
  allocatedText: { fontSize: 13 },
  categoryText: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
});
