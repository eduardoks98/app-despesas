import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../hooks/useColors';
import { useTheme } from '../contexts/ThemeContext';

interface ContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

export const Container: React.FC<ContainerProps> = ({ 
  children, 
  backgroundColor 
}) => {
  const colors = useColors();
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: backgroundColor || colors.background,
        paddingTop: insets.top,
      }
    ]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={colors.background} 
        translucent={true}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});