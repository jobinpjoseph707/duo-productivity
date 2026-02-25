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
  return (
    <TouchableOpacity
      style={[styles.node, completed ? styles.nodeCompleted : styles.nodeIncomplete]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {completed ? (
        <MaterialIcons name="check" size={28} color="#FFFFFF" />
      ) : (
        <Text style={[styles.number, completed ? styles.numberCompleted : styles.numberIncomplete]}>
          {nodeNumber}
        </Text>
      )}
      <Text
        style={[styles.title, completed ? styles.titleCompleted : styles.titleIncomplete]}
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
  nodeCompleted: {
    backgroundColor: '#58CC02',
    borderColor: '#58CC02',
  },
  nodeIncomplete: {
    backgroundColor: '#1A2C34',
    borderColor: '#58CC02',
  },
  number: {
    fontSize: 24,
    fontWeight: '700',
  },
  numberCompleted: {
    color: '#FFFFFF',
  },
  numberIncomplete: {
    color: '#58CC02',
  },
  title: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  titleCompleted: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  titleIncomplete: {
    color: '#9CA3AF',
  },
});
