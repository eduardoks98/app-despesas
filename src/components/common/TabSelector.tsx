import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';

interface TabOption {
  key: string;
  label: string;
  icon?: string;
  color?: string;
}

interface TabSelectorProps {
  options: TabOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: ViewStyle;
}

export const TabSelector: React.FC<TabSelectorProps> = ({
  options,
  selectedValue,
  onValueChange,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option.key}
          style={[
            styles.tab,
            index === 0 && styles.firstTab,
            index === options.length - 1 && styles.lastTab,
            selectedValue === option.key && styles.activeTab
          ]}
          onPress={() => onValueChange(option.key)}
          activeOpacity={0.7}
        >
          {option.icon && (
            <Ionicons 
              name={option.icon as any} 
              size={16} 
              color={selectedValue === option.key ? colors.white : (option.color || colors.textSecondary)}
              style={styles.icon}
            />
          )}
          <Text style={[
            styles.tabText,
            selectedValue === option.key && styles.activeTabText
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 6,
  },
  firstTab: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  lastTab: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  icon: {
    marginRight: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.white,
    fontWeight: '600',
  },
});