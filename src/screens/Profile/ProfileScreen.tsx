import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity, 
  Alert,
  Switch,
  Share
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StorageService } from '../../services/storage/StorageService';
import { InstallmentCalculations } from '../../services/calculations/InstallmentCalculations';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { QuickTour } from '../../components/onboarding/QuickTour';
import { HapticService } from '../../services/haptic/HapticService';
import { useColors } from '../../hooks/useColors';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const colors = useColors();
  const { theme, setTheme, isDarkMode } = useTheme();
  
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalInstallments: 0,
    totalIncome: 0,
    totalExpenses: 0,
    activeInstallments: 0,
  });

  const [settings, setSettings] = useState({
    hideValues: false,
    enableNotifications: true,
    hapticEnabled: true,
    biometricEnabled: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showQuickTour, setShowQuickTour] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const hapticEnabled = await StorageService.getHapticEnabled();
      setSettings(prev => ({ ...prev, hapticEnabled }));
      HapticService.setEnabled(hapticEnabled);
    } catch (error) {
      console.log('Error loading haptic settings:', error);
    }
  };

  const loadStats = async () => {
    const result = await ErrorHandler.withErrorHandling(
      'carregar estatísticas do usuário',
      async () => {
        const [transactions, installments] = await Promise.all([
          StorageService.getTransactions(),
          StorageService.getInstallments()
        ]);

        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const activeInstallments = installments.filter(i => i.status === 'active').length;

        const statsData = {
          totalTransactions: transactions.length,
          totalInstallments: installments.length,
          totalIncome,
          totalExpenses,
          activeInstallments,
        };

        setStats(statsData);
        return statsData;
      },
      false // Não mostrar erro para o usuário - apenas loggar
    );
    
    // Se falhou, manter estado de carregamento atual
    if (!result) {
      setStats({
        totalTransactions: 0,
        totalInstallments: 0,
        totalIncome: 0,
        totalExpenses: 0,
        activeInstallments: 0,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleExportData = async () => {
    setIsLoading(true);

    const result = await ErrorHandler.withErrorHandling(
      'exportar dados',
      async () => {
        const data = await StorageService.exportData();
        
        const currentDate = new Date().toISOString().split('T')[0];

        await Share.share({
          message: data,
          title: 'Backup App Despesas',
        });

        return true;
      }
    );

    setIsLoading(false);

    if (result) {
      await HapticService.success();
      Alert.alert('Sucesso', 'Backup exportado com sucesso!');
    } else {
      await HapticService.error();
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Confirmar Limpeza',
      'Esta ação irá remover TODOS os seus dados (transações, parcelamentos, etc.). Esta ação não pode ser desfeita.\n\nDeseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            await HapticService.destructive();
            setIsLoading(true);
            
            const result = await ErrorHandler.withErrorHandling(
              'limpar todos os dados',
              async () => {
                await StorageService.clearAllData();
                return true;
              }
            );
            
            setIsLoading(false);
            
            if (result) {
              await HapticService.success();
              setStats({
                totalTransactions: 0,
                totalInstallments: 0,
                totalIncome: 0,
                totalExpenses: 0,
                activeInstallments: 0,
              });
              Alert.alert('Sucesso', 'Todos os dados foram removidos');
            } else {
              await HapticService.error();
            }
          }
        }
      ]
    );
  };

  const handleGenerateSampleData = async () => {
    Alert.alert(
      'Gerar Dados de Teste',
      'Isso irá adicionar transações e parcelamentos de exemplo para testar o app. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Gerar',
          onPress: async () => {
            setIsLoading(true);
            
            const result = await ErrorHandler.withErrorHandling(
              'gerar dados de teste',
              async () => {
                await generateSampleData();
                await loadStats();
                return true;
              }
            );
            
            setIsLoading(false);
            
            if (result) {
              await HapticService.success();
              Alert.alert('Sucesso', 'Dados de teste gerados com sucesso!');
            } else {
              await HapticService.error();
            }
          }
        }
      ]
    );
  };

  const generateSampleData = async () => {
    const currentDate = new Date();
    
    // Gerar transações de exemplo
    const sampleTransactions = [
      {
        id: `sample_transaction_1_${Date.now()}`,
        type: 'income' as const,
        amount: 3500,
        description: 'Salário',
        category: 'Salário',
        date: currentDate.toISOString(),
        paymentMethod: 'pix' as const,
      },
      {
        id: `sample_transaction_2_${Date.now()}`,
        type: 'expense' as const,
        amount: 450,
        description: 'Supermercado',
        category: 'Alimentação',
        date: new Date(currentDate.getTime() - 86400000).toISOString(), // 1 dia atrás
        paymentMethod: 'debit' as const,
      },
      {
        id: `sample_transaction_3_${Date.now()}`,
        type: 'expense' as const,
        amount: 120,
        description: 'Combustível',
        category: 'Transporte',
        date: new Date(currentDate.getTime() - 172800000).toISOString(), // 2 dias atrás
        paymentMethod: 'credit' as const,
      },
      {
        id: `sample_transaction_4_${Date.now()}`,
        type: 'expense' as const,
        amount: 89.90,
        description: 'Farmácia',
        category: 'Saúde',
        date: new Date(currentDate.getTime() - 259200000).toISOString(), // 3 dias atrás
        paymentMethod: 'cash' as const,
      },
    ];

    // Gerar parcelamentos de exemplo
    const startDate = new Date();
    startDate.setDate(1); // Primeiro dia do mês

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 11); // 12 meses

    const sampleInstallment = {
      id: `sample_installment_${Date.now()}`,
      description: 'Smartphone Samsung Galaxy',
      totalAmount: 2400,
      totalInstallments: 12,
      currentInstallment: 1,
      installmentValue: 200,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      category: 'Compras',
      store: 'Samsung Store',
      status: 'active' as const,
      paidInstallments: [1], // Primeira parcela já paga
      paymentMethod: 'credit' as const,
    };

    // Salvar dados de exemplo
    for (const transaction of sampleTransactions) {
      await StorageService.saveTransaction(transaction);
    }

    await StorageService.saveInstallment(sampleInstallment);

    // Adicionar transação da primeira parcela do parcelamento
    await StorageService.saveTransaction({
      id: `sample_installment_transaction_${Date.now()}`,
      type: 'expense',
      amount: 200,
      description: 'Smartphone Samsung Galaxy (1/12)',
      category: 'Compras',
      date: startDate.toISOString(),
      installmentId: sampleInstallment.id,
      installmentNumber: 1,
      paymentMethod: 'credit',
    });
  };

  const handleThemePress = async () => {
    await HapticService.buttonPress();
    Alert.alert(
      'Selecionar Tema',
      'Escolha o tema do aplicativo',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Claro', 
          onPress: async () => {
            await HapticService.selection();
            setTheme('light');
          },
          style: theme === 'light' ? 'default' : 'default'
        },
        { 
          text: 'Escuro', 
          onPress: async () => {
            await HapticService.selection();
            setTheme('dark');
          },
          style: theme === 'dark' ? 'default' : 'default'
        },
        { 
          text: 'Sistema', 
          onPress: async () => {
            await HapticService.selection();
            setTheme('system');
          },
          style: theme === 'system' ? 'default' : 'default'
        }
      ]
    );
  };

  const handleHapticToggle = async (value: boolean) => {
    await HapticService.toggle();
    setSettings(prev => ({ ...prev, hapticEnabled: value }));
    HapticService.setEnabled(value);
    await StorageService.saveHapticEnabled(value);
  };

  const menuItems = [
    {
      icon: 'help-circle',
      title: 'Tour do App',
      subtitle: 'Revisar recursos e funcionalidades',
      onPress: async () => {
        await HapticService.buttonPress();
        setShowQuickTour(true);
      },
    },
    {
      icon: 'notifications',
      title: 'Configurar Notificações',
      subtitle: 'Gerenciar lembretes de pagamentos',
      onPress: async () => {
        await HapticService.buttonPress();
        navigation.navigate('Notifications');
      },
    },
    {
      icon: 'download',
      title: 'Exportar Dados',
      subtitle: 'PDF, CSV ou backup completo',
      onPress: async () => {
        await HapticService.buttonPress();
        navigation.navigate('Export');
      },
    },
    {
      icon: 'refresh',
      title: 'Dados de Teste',
      subtitle: 'Gerar transações de exemplo',
      onPress: async () => {
        await HapticService.buttonPress();
        await handleGenerateSampleData();
      },
    },
    {
      icon: 'trash',
      title: 'Limpar Todos os Dados',
      subtitle: 'Remover todas as transações e parcelamentos',
      onPress: async () => {
        await HapticService.warning();
        await handleClearAllData();
      },
      danger: true,
    },
  ];

  const styles = createStyles(colors);

  return (
    <Container>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.white} />
          </View>
          <Text style={styles.name}>Usuário</Text>
          <Text style={styles.subtitle}>App Despesas</Text>
        </View>

        {/* Estatísticas */}
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Suas Estatísticas</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalTransactions}</Text>
              <Text style={styles.statLabel}>Transações</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalInstallments}</Text>
              <Text style={styles.statLabel}>Parcelamentos</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.incomeValue]}>
                R$ {stats.totalIncome.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Receitas</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                R$ {stats.totalExpenses.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Despesas</Text>
            </View>
          </View>
        </Card>

        {/* Configurações */}
        <Card>
          <Text style={styles.cardTitle}>Configurações</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="eye-off" size={20} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Ocultar Valores</Text>
                <Text style={styles.settingSubtitle}>Privacidade dos valores monetários</Text>
              </View>
            </View>
            <Switch
              value={settings.hideValues}
              onValueChange={async (value) => {
                await HapticService.toggle();
                setSettings(prev => ({ ...prev, hideValues: value }));
              }}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.hideValues ? colors.primary : colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={20} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Notificações</Text>
                <Text style={styles.settingSubtitle}>Lembretes de vencimento</Text>
              </View>
            </View>
            <Switch
              value={settings.enableNotifications}
              onValueChange={async (value) => {
                await HapticService.toggle();
                setSettings(prev => ({ ...prev, enableNotifications: value }));
              }}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.enableNotifications ? colors.primary : colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait" size={20} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Vibração</Text>
                <Text style={styles.settingSubtitle}>Feedback tátil nas interações</Text>
              </View>
            </View>
            <Switch
              value={settings.hapticEnabled}
              onValueChange={handleHapticToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={settings.hapticEnabled ? colors.primary : colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Tema</Text>
                <Text style={styles.settingSubtitle}>
                  {theme === 'system' ? 'Seguir sistema' : 
                   theme === 'dark' ? 'Escuro' : 'Claro'}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => handleThemePress()}
              style={styles.themeButton}
            >
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Menu de ações */}
        <Card>
          <Text style={styles.cardTitle}>Dados e Backup</Text>
          
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                item.danger && styles.dangerMenuItem
              ]}
              onPress={item.onPress}
              disabled={isLoading}
            >
              <View style={styles.menuItemLeft}>
                <View style={[
                  styles.menuIcon,
                  item.danger && styles.dangerIcon
                ]}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={20} 
                    color={item.danger ? colors.danger : colors.primary} 
                  />
                </View>
                <View>
                  <Text style={[
                    styles.menuTitle,
                    item.danger && styles.dangerText
                  ]}>
                    {item.title}
                  </Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Informações do app */}
        <Card>
          <Text style={styles.cardTitle}>Sobre o App</Text>
          
          <View style={styles.appInfo}>
            <Text style={styles.appName}>App Despesas</Text>
            <Text style={styles.appVersion}>Versão 1.0.0</Text>
            <Text style={styles.appDescription}>
              Controle financeiro com foco em parcelamentos
            </Text>
          </View>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Quick Tour Modal */}
      <QuickTour
        visible={showQuickTour}
        onClose={() => setShowQuickTour(false)}
      />
    </Container>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  incomeValue: {
    color: colors.success,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  themeButton: {
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: colors.dangerLight,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dangerMenuItem: {
    // Specific styles for danger items if needed
  },
  dangerText: {
    color: colors.danger,
  },
  appInfo: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});