import React from 'react';
import { Pressable, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../../styles';
import { ICON_SIZES, SPACING, moderateScale } from '../../styles/responsive';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

export const FAB: React.FC<FABProps> = ({ 
  onPress,
  icon = 'add',
  size = ICON_SIZES.lg,
  color = colors.white,
  backgroundColor = colors.primary,
  style
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 150,
      friction: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 4,
    }).start();
  };

  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ scale: scaleAnim }] },
      style
    ]}>
      <Pressable
        style={[styles.button, { backgroundColor }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Ionicons name={icon} size={size} color={color} />
      </Pressable>
    </Animated.View>
  );
};

const fabSize = moderateScale(56);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: SPACING.xxl + SPACING.md,
    right: SPACING.md,
  },
  button: {
    width: fabSize,
    height: fabSize,
    borderRadius: fabSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
});