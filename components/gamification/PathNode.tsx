import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

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
  const bgColor = completed ? 'bg-primary' : 'bg-surface';
  const textColor = completed ? 'text-white' : 'text-primary';

  return (
    <TouchableOpacity
      className={`${bgColor} w-20 h-20 rounded-full items-center justify-center border-2 border-primary`}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text className={`${textColor} text-3xl`}>
        {completed ? '✓' : nodeNumber}
      </Text>
      <Text className={`${textColor} text-xs text-center mt-xs font-outfit line-clamp-2`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
