import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { useColors } from '../../hooks/useColors';
import { useTheme } from '../../contexts/ThemeContext';

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
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundColor || colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={colors.background} 
      />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});