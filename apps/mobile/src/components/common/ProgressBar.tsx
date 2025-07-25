import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../styles/colors';

interface ProgressBarProps {
  progress: number; // 0-100
  style?: ViewStyle;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress,
  style,
  color = colors.primary,
  backgroundColor = colors.border,
  height = 6
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={[styles.container, { height, backgroundColor }, style]}>
      <View 
        style={[
          styles.fill,
          { 
            width: `${clampedProgress}%`,
            backgroundColor: color
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});