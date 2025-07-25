import React from 'react';
import { Platform, Modal as RNModal, View } from 'react-native';

interface PlatformModalProps {
  isVisible: boolean;
  onBackdropPress?: () => void;
  onSwipeComplete?: () => void;
  swipeDirection?: 'up' | 'down' | 'left' | 'right';
  style?: any;
  children: React.ReactNode;
}

export const PlatformModal: React.FC<PlatformModalProps> = ({
  isVisible,
  onBackdropPress,
  onSwipeComplete,
  swipeDirection = 'down',
  style,
  children
}) => {
  if (Platform.OS === 'web') {
    return (
      <RNModal
        visible={isVisible}
        transparent
        animationType="slide"
        onRequestClose={onBackdropPress}
      >
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={onBackdropPress}
        >
          <div
            onClick={(e: any) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              backgroundColor: 'white',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              overflow: 'hidden'
            }}
          >
            {children}
          </div>
        </div>
      </RNModal>
    );
  }

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onBackdropPress}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        ...style
      }}>
        {children}
      </View>
    </RNModal>
  );
};