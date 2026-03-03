import { useTheme } from '@/hooks/useTheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface PathNodeProps {
  nodeNumber: number;
  title: string;
  completed: boolean;
  onPress: () => void;
}

export function PathNode({
  nodeNumber,
  title,
  completed,
  onPress,
}: PathNodeProps) {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <TouchableOpacity
      style={[
        styles.node,
        completed
          ? { backgroundColor: c.primary, borderColor: c.primary }
          : { backgroundColor: c.surface, borderColor: c.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {completed ? (
        <MaterialIcons name="check" size={28} color="#FFFFFF" />
      ) : (
        <Text style={[styles.number, { color: c.primary }]}>
          {nodeNumber}
        </Text>
      )}
      <Text
        style={[
          styles.title,
          completed
            ? { color: '#FFFFFF', fontWeight: '600' }
            : { color: c.textSecondary },
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  node: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  number: { fontSize: 24, fontWeight: '700' },
  title: { fontSize: 9, textAlign: 'center', marginTop: 2, paddingHorizontal: 4 },
});
