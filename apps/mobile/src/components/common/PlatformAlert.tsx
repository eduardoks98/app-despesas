import React, { useState } from 'react';
import { Platform, Alert, View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useColors } from '../../hooks/useColors';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface PlatformAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  onDismiss: () => void;
}

const WebAlert: React.FC<PlatformAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onDismiss
}) => {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.alertContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.alertTitle, { color: colors.text }]}>{title}</Text>
          {message && <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>{message}</Text>}
          
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  { borderTopColor: colors.border },
                  index > 0 && { borderLeftColor: colors.border, borderLeftWidth: 1 }
                ]}
                onPress={() => {
                  onDismiss();
                  button.onPress?.();
                }}
              >
                <Text style={[
                  styles.buttonText,
                  { color: button.style === 'destructive' ? colors.danger : colors.primary },
                  button.style === 'cancel' && { fontWeight: '400' }
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export class PlatformAlert {
  private static currentAlert: {
    visible: boolean;
    title: string;
    message?: string;
    buttons: AlertButton[];
    setVisible: (visible: boolean) => void;
  } | null = null;

  static show(title: string, message?: string, buttons: AlertButton[] = [{ text: 'OK' }]) {
    if (Platform.OS === 'web') {
      // Para web, precisamos usar um componente React
      // Esta é uma implementação simplificada - em produção você usaria um estado global
      return;
    } else {
      Alert.alert(title, message, buttons);
    }
  }
}

// Hook para usar o alert no web
export const useWebAlert = () => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: []
  });

  const showAlert = (title: string, message?: string, buttons: AlertButton[] = [{ text: 'OK' }]) => {
    if (Platform.OS === 'web') {
      setAlertState({
        visible: true,
        title,
        message,
        buttons
      });
    } else {
      Alert.alert(title, message, buttons);
    }
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = Platform.OS === 'web' ? (
    <WebAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      onDismiss={hideAlert}
    />
  ) : null;

  return { showAlert, AlertComponent };
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  alertMessage: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderTopWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});