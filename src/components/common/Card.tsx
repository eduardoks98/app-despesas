import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { shadows } from '../../styles';
import { useColors } from '../../hooks/useColors';
import { SPACING, LAYOUT } from '../../styles/responsive';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'danger';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  style, 
  onPress,
  variant = 'default' 
}) => {
  const colors = useColors();
  const styles = createStyles(colors);
  
  const cardStyles = [
    styles.card,
    variant === 'primary' && styles.cardPrimary,
    variant === 'danger' && styles.cardDanger,
    style
  ];

  if (onPress) {
    return (
      <Pressable 
        style={({ pressed }) => [
          ...cardStyles,
          pressed && styles.pressed
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: LAYOUT.borderRadius,
    padding: LAYOUT.cardPadding,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    ...shadows.small,
  },
  cardPrimary: {
    backgroundColor: colors.primary,
  },
  cardDanger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});