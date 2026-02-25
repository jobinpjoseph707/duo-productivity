import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface TimeRingProps {
  allocated: number;
  spent: number;
  category: string;
}

export function TimeRing({
  allocated,
  spent,
  category,
}: TimeRingProps) {
  const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <Svg width={120} height={120} viewBox="0 0 120 120">
        {/* Background circle */}
        <Circle
          cx={60}
          cy={60}
          r={45}
          stroke="#243B45"
          strokeWidth={8}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={60}
          cy={60}
          r={45}
          stroke="#58CC02"
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </Svg>
      <View style={styles.labelContainer}>
        <Text style={styles.spentText}>{spent}m</Text>
        <Text style={styles.allocatedText}>of {allocated}m</Text>
        <Text style={styles.categoryText}>{category}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  labelContainer: {
    alignItems: 'center',
  },
  spentText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#58CC02',
  },
  allocatedText: {
    fontSize: 13,
    color: '#6B7280',
  },
  categoryText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
