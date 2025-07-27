import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { NotificationService, NotificationSettings } from '../../services/platform';
import { ErrorHandler } from '../../services/utils';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    dailyReminder: false,
    dailyReminderTime: '09:00',
    upcomingPayments: true,
    upcomingPaymentsDays: 3,
    overduePayments: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [todaysPayments, setTodaysPayments] = useState<{
    upcoming: Array<{ installment: any; installmentNumber: number }>;
    overdue: Array<{ installment: any; installmentNumber: number; daysOverdue: number }>;
  }>({ upcoming: [], overdue: [] });

  useEffect(() => {
    loadSettings();
    loadTodaysPayments();
  }, []);

  const loadSettings = async () => {
    const currentSettings = NotificationService.getSettings();
    setSettings(currentSettings);
  };

  const loadTodaysPayments = async () => {
    const payments = await NotificationService.checkTodaysPayments();
    setTodaysPayments(payments);
  };

  const handleSettingChange = async (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Salvar automaticamente
    await ErrorHandler.withErrorHandling(
      'salvar configurações de notificação',
      async () => {
        await NotificationService.saveSettings({ [key]: value });
        
        // Re-agendar notificações se necessário
        if (key === 'enabled' || key === 'dailyReminder' || key === 'upcomingPayments' || key === 'overduePayments') {
          await NotificationService.scheduleAllNotifications();
        }
      },
      false
    );
  };

  const handleTimeChange = () => {
    Alert.alert(
      'Horário do Lembrete',
      'Em que horário você gostaria de receber o lembrete diário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: '08:00', onPress: () => handleSettingChange('dailyReminderTime', '08:00') },
        { text: '09:00', onPress: () => handleSettingChange('dailyReminderTime', '09:00') },
        { text: '10:00', onPress: () => handleSettingChange('dailyReminderTime', '10:00') },
        { text: '12:00', onPress: () => handleSettingChange('dailyReminderTime', '12:00') },
        { text: '18:00', onPress: () => handleSettingChange('dailyReminderTime', '18:00') },
        { text: '20:00', onPress: () => handleSettingChange('dailyReminderTime', '20:00') },
      ]
    );
  };

  const handleDaysChange = () => {
    Alert.alert(
      'Antecedência do Aviso',
      'Com quantos dias de antecedência você quer ser avisado sobre parcelas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: '1 dia', onPress: () => handleSettingChange('upcomingPaymentsDays', 1) },
        { text: '3 dias', onPress: () => handleSettingChange('upcomingPaymentsDays', 3) },
        { text: '5 dias', onPress: () => handleSettingChange('upcomingPaymentsDays', 5) },
        { text: '7 dias', onPress: () => handleSettingChange('upcomingPaymentsDays', 7) },
      ]
    );
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    
    await ErrorHandler.withErrorHandling(
      'enviar notificação de teste',
      async () => {
        await NotificationService.sendImmediateNotification(
          '🔔 Teste de Notificação',
          'Esta é uma notificação de teste do App Despesas!'
        );
        Alert.alert('Sucesso', 'Notificação de teste enviada!');
      }
    );
    
    setIsLoading(false);
  };

  const handleRescheduleAll = async () => {
    setIsLoading(true);
    
    await ErrorHandler.withErrorHandling(
      'reagendar todas as notificações',
      async () => {
        await NotificationService.scheduleAllNotifications();
        Alert.alert('Sucesso', 'Todas as notificações foram reagendadas!');
      }
    );
    
    setIsLoading(false);
  };

  const getTimeLabel = () => {
    const [hours, minutes] = settings.dailyReminderTime.split(':');
    return `${hours}:${minutes}`;
  };

  const getDaysLabel = () => {
    const days = settings.upcomingPaymentsDays;
    return `${days} dia${days > 1 ? 's' : ''}`;
  };

  return (
    <Container>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Notificações</Text>
        </View>

        {/* Status dos pagamentos de hoje */}
        {(todaysPayments.upcoming.length > 0 || todaysPayments.overdue.length > 0) && (
          <Card style={styles.todayCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Pagamentos de Hoje</Text>
              <Ionicons name="today" size={20} color={colors.primary} />
            </View>
            
            {todaysPayments.upcoming.length > 0 && (
              <View style={styles.paymentsSection}>
                <Text style={styles.paymentsSectionTitle}>Vencendo hoje:</Text>
                {todaysPayments.upcoming.map((payment, index) => (
                  <View key={index} style={styles.paymentItem}>
                    <Text style={styles.paymentText}>
                      {payment.installment.description} - Parcela {payment.installmentNumber}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {todaysPayments.overdue.length > 0 && (
              <View style={styles.paymentsSection}>
                <Text style={[styles.paymentsSectionTitle, styles.overdueTitle]}>Em atraso:</Text>
                {todaysPayments.overdue.map((payment, index) => (
                  <View key={index} style={styles.paymentItem}>
                    <Text style={[styles.paymentText, styles.overdueText]}>
                      {payment.installment.description} - {payment.daysOverdue} dias
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        {/* Configurações gerais */}
        <Card>
          <Text style={styles.cardTitle}>Configurações Gerais</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={20} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Notificações Ativadas</Text>
                <Text style={styles.settingSubtitle}>Habilitar todas as notificações</Text>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => handleSettingChange('enabled', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.enabled ? colors.primary : colors.white}
            />
          </View>
        </Card>

        {/* Lembretes diários */}
        <Card>
          <Text style={styles.cardTitle}>Lembretes Diários</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="alarm" size={20} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Lembrete Diário</Text>
                <Text style={styles.settingSubtitle}>Receber lembrete para verificar finanças</Text>
              </View>
            </View>
            <Switch
              value={settings.dailyReminder}
              onValueChange={(value) => handleSettingChange('dailyReminder', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.dailyReminder ? colors.primary : colors.white}
              disabled={!settings.enabled}
            />
          </View>

          {settings.dailyReminder && (
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={handleTimeChange}
              disabled={!settings.enabled}
            >
              <Text style={styles.timeSelectorLabel}>Horário:</Text>
              <Text style={styles.timeSelectorValue}>{getTimeLabel()}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Lembretes de parcelas */}
        <Card>
          <Text style={styles.cardTitle}>Lembretes de Parcelas</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Parcelas Próximas</Text>
                <Text style={styles.settingSubtitle}>Avisar sobre parcelas que vão vencer</Text>
              </View>
            </View>
            <Switch
              value={settings.upcomingPayments}
              onValueChange={(value) => handleSettingChange('upcomingPayments', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.upcomingPayments ? colors.primary : colors.white}
              disabled={!settings.enabled}
            />
          </View>

          {settings.upcomingPayments && (
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={handleDaysChange}
              disabled={!settings.enabled}
            >
              <Text style={styles.timeSelectorLabel}>Antecedência:</Text>
              <Text style={styles.timeSelectorValue}>{getDaysLabel()}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <View style={[styles.settingItem, styles.lastSettingItem]}>
            <View style={styles.settingInfo}>
              <Ionicons name="warning" size={20} color={colors.danger} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Parcelas Vencidas</Text>
                <Text style={styles.settingSubtitle}>Avisar sobre parcelas em atraso</Text>
              </View>
            </View>
            <Switch
              value={settings.overduePayments}
              onValueChange={(value) => handleSettingChange('overduePayments', value)}
              trackColor={{ false: colors.border, true: colors.dangerLight }}
              thumbColor={settings.overduePayments ? colors.danger : colors.white}
              disabled={!settings.enabled}
            />
          </View>
        </Card>

        {/* Ações */}
        <Card>
          <Text style={styles.cardTitle}>Teste e Manutenção</Text>
          
          <Button
            title="Enviar Notificação de Teste"
            onPress={handleTestNotification}
            variant="outline"
            disabled={!settings.enabled || isLoading}
            style={styles.actionButton}
          />
          
          <Button
            title="Reagendar Todas as Notificações"
            onPress={handleRescheduleAll}
            variant="outline"
            disabled={!settings.enabled || isLoading}
            style={styles.actionButton}
          />
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  todayCard: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  paymentsSection: {
    marginBottom: 12,
  },
  paymentsSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  overdueTitle: {
    color: colors.danger,
  },
  paymentItem: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  paymentText: {
    fontSize: 14,
    color: colors.text,
  },
  overdueText: {
    color: colors.danger,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginTop: 8,
  },
  timeSelectorLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timeSelectorValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  actionButton: {
    marginBottom: 8,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default NotificationsScreen;