import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';

interface AppIconProps {
  size?: number;
  style?: any;
}

export const AppIcon: React.FC<AppIconProps> = ({ 
  size = 120, 
  style 
}) => {
  const colors = useColors();
  
  const iconSize = size * 0.5; // Icon should be 50% of container size
  const cornerRadius = size * 0.22; // iOS-style corner radius (22%)
  
  const dynamicStyles = {
    container: {
      width: size,
      height: size,
      borderRadius: cornerRadius,
    },
    icon: {
      fontSize: iconSize,
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container, style]}>
      {/* Gradient background effect with overlays */}
      <View style={[styles.gradientOverlay, dynamicStyles.container]} />
      
      {/* Main icon */}
      <Ionicons 
        name="wallet" 
        size={iconSize} 
        color="#FFFFFF" 
        style={styles.icon}
      />
      
      {/* Inner shadow effect */}
      <View style={[styles.innerShadow, dynamicStyles.container]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // Outer shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  gradientOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 92, 246, 0.3)', // Lighter purple overlay
    top: 0,
    left: 0,
  },
  icon: {
    zIndex: 2,
    // Icon shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  innerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
});

// App Logo component for use in headers, splash screen, etc.
export const AppLogo: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({ 
  size = 'medium' 
}) => {
  const sizeMap = {
    small: 40,
    medium: 80,
    large: 120
  };
  
  return <AppIcon size={sizeMap[size]} />;
};