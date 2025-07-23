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
      toValue: 0.95,
      useNativeDriver: true,
      tension: 200,
      friction: 5,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 5,
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

const fabSize = moderateScale(48);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom:  SPACING.sm,
    right: SPACING.sm,
  },
  button: {
    width: fabSize,
    height: fabSize,
    borderRadius: fabSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Melhoria na responsividade do toque
    overflow: 'hidden',
  },
});