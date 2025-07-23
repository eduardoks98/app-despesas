import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  action?: () => void;
  actionText?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  style,
  titleStyle,
  subtitleStyle,
  action,
  actionText
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        )}
      </View>
      
      <View style={styles.rightContainer}>
        {action && (
          <TouchableOpacity onPress={action} style={styles.actionButton}>
            <Ionicons name="chevron-forward" size={16} color="#FFE4B5" />
          </TouchableOpacity>
        )}
        {icon && (
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={colors.white} 
            style={action && actionText ? styles.iconWithAction : undefined}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#8B7EC8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#7B6EBB',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },
  iconWithAction: {
    marginLeft: 4,
  },
});