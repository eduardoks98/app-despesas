import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validation';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateForm = (): boolean => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email é obrigatório');
      return false;
    }

    if (!validateEmail(email)) {
      setEmailError('Email inválido');
      return false;
    }

    return true;
  };

  const handleSendEmail = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const success = await requestPasswordReset(email.trim().toLowerCase());
      
      if (success) {
        setEmailSent(true);
      } else {
        Alert.alert('Erro', 'Falha ao enviar email de recuperação');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleResendEmail = async () => {
    setEmailSent(false);
    await handleSendEmail();
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content style={styles.successContent}>
              <View style={styles.successIcon}>
                <Title style={styles.successIconText}>✉️</Title>
              </View>
              
              <Title style={styles.successTitle}>Email enviado!</Title>
              
              <Paragraph style={styles.successText}>
                Se o email {email} estiver cadastrado em nossa base, você receberá
                um link para redefinir sua senha.
              </Paragraph>
              
              <Paragraph style={styles.instructionText}>
                Verifique sua caixa de entrada e spam. O link expira em 1 hora.
              </Paragraph>

              <Button
                mode="contained"
                onPress={handleResendEmail}
                style={styles.resendButton}
                contentStyle={styles.buttonContent}
              >
                Reenviar email
              </Button>

              <Button
                mode="outlined"
                onPress={handleBackToLogin}
                style={styles.backButton}
                contentStyle={styles.buttonContent}
              >
                Voltar ao login
              </Button>
            </Card.Content>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Title style={styles.title}>Esqueci minha senha</Title>
            <Paragraph style={styles.subtitle}>
              Digite seu email para receber um link de recuperação
            </Paragraph>
          </View>

          {/* Form */}
          <Card style={styles.card}>
            <Card.Content>
              <TextInput
                label="Email"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={!!emailError}
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
                placeholder="seu@email.com"
              />
              {emailError ? (
                <Paragraph style={styles.errorText}>{emailError}</Paragraph>
              ) : null}

              <Button
                mode="contained"
                onPress={handleSendEmail}
                disabled={isLoading}
                style={styles.sendButton}
                contentStyle={styles.buttonContent}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  'Enviar link de recuperação'
                )}
              </Button>

              <Button
                mode="text"
                onPress={handleBackToLogin}
                style={styles.backToLoginButton}
              >
                Voltar ao login
              </Button>
            </Card.Content>
          </Card>

          {/* Help Info */}
          <Card style={styles.helpCard}>
            <Card.Content>
              <Title style={styles.helpTitle}>Precisa de ajuda?</Title>
              <Paragraph style={styles.helpText}>
                • Verifique se o email está correto{'\n'}
                • Procure na pasta de spam{'\n'}
                • O link expira em 1 hora{'\n'}
                • Entre em contato conosco se não receber
              </Paragraph>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 12,
  },
  sendButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  buttonContent: {
    height: 48,
  },
  backToLoginButton: {
    marginTop: 8,
  },
  helpCard: {
    elevation: 2,
  },
  helpTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#333',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Success state styles
  successContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successIconText: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  instructionText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  resendButton: {
    marginBottom: 12,
    width: '100%',
  },
  backButton: {
    borderColor: '#8B5CF6',
    width: '100%',
  },
});