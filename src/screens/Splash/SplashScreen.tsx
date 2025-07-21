import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated
} from 'react-native';
import { StorageService } from '../../services/storage/StorageService';
import { NotificationService } from '../../services/notifications/NotificationService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { HapticService } from '../../services/haptic/HapticService';
import { AppIcon } from '../../components/common/AppIcon';
import { useColors } from '../../hooks/useColors';
import { Ionicons } from '@expo/vector-icons';

interface SplashScreenProps {
  navigation: any;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const colors = useColors();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const logoRotateAnim = new Animated.Value(0);

  useEffect(() => {
    initializeApp();
    startAnimation();
  }, []);

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  };

  const initializeApp = async () => {
    await ErrorHandler.withErrorHandling(
      'inicializar aplicativo',
      async () => {
        // Inicializar configurações de haptic feedback
        const hapticEnabled = await StorageService.getHapticEnabled();
        HapticService.setEnabled(hapticEnabled);
        
        // Pequeno delay para mostrar a splash screen
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verificar se é a primeira vez que o usuário abre o app
        const onboardingCompleted = await StorageService.getUserPreference('onboarding_completed');
        
        if (!onboardingCompleted) {
          // Primeira vez - mostrar onboarding
          navigation.replace('Onboarding');
        } else {
          // Usuário já passou pelo onboarding
          // Inicializar notificações se necessário
          await NotificationService.initialize();
          
          // Verificar se há pagamentos importantes hoje
          await checkTodaysPayments();
          
          // Ir para a tela principal
          navigation.replace('Main');
        }
      },
      false
    );

    // Fallback caso algo dê errado - ir direto para o app
    setTimeout(() => {
      navigation.replace('Main');
    }, 5000);
  };

  const checkTodaysPayments = async () => {
    const payments = await NotificationService.checkTodaysPayments();
    
    // Se há pagamentos vencendo hoje ou vencidos, enviar notificação
    if (payments.upcoming.length > 0) {
      await NotificationService.sendImmediateNotification(
        '📅 Parcelas vencendo hoje!',
        `Você tem ${payments.upcoming.length} parcela${payments.upcoming.length > 1 ? 's' : ''} vencendo hoje`
      );
    }
    
    if (payments.overdue.length > 0) {
      await NotificationService.sendImmediateNotification(
        '⚠️ Parcelas em atraso!',
        `Você tem ${payments.overdue.length} parcela${payments.overdue.length > 1 ? 's' : ''} em atraso`
      );
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Logo/Ícone */}
        <View style={styles.logoContainer}>
          <Animated.View 
            style={{
              transform: [{
                rotate: logoRotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }}
          >
            <AppIcon size={120} />
          </Animated.View>
        </View>

        {/* Nome do app */}
        <Text style={styles.appName}>App Despesas</Text>
        <Text style={styles.tagline}>Controle Financeiro Inteligente</Text>

        {/* Loading */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </Animated.View>

      {/* Versão */}
      <View style={styles.footer}>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});