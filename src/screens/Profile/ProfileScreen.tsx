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
import { useWebAlert } from '../../components/common/PlatformAlert';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { CardHeader } from '../../components/common/CardHeader';
import { Button } from '../../components/common/Button';
import { StorageService } from '../../services/storage/StorageService';
import { InstallmentCalculations } from '../../services/calculations/InstallmentCalculations';
import { ErrorHandler } from '../../services/error/ErrorHandler';
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
  const { showAlert, AlertComponent } = useWebAlert();
  

  const [settings, setSettings] = useState({
    hideValues: false,
    enableNotifications: true,
    hapticEnabled: true,
    biometricEnabled: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSettings();
    });

    loadSettings();
    return unsubscribe;
  }, [navigation]);

  const loadSettings = async () => {
    try {
      const hapticEnabled = await StorageService.getHapticEnabled();
      setSettings(prev => ({ ...prev, hapticEnabled }));
      HapticService.setEnabled(hapticEnabled);
    } catch (error) {
      console.log('Error loading haptic settings:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
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
      showAlert('Sucesso', 'Backup exportado com sucesso!', [{ text: 'OK' }]);
    } else {
      await HapticService.error();
    }
  };

  const handleClearAllData = () => {
    showAlert(
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
              showAlert('Sucesso', 'Todos os dados foram removidos', [{ text: 'OK' }]);
            } else {
              await HapticService.error();
            }
          }
        }
      ]
    );
  };

  const handleGenerateSampleData = async () => {
    showAlert(
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
                return true;
              }
            );
            
            setIsLoading(false);
            
            if (result) {
              await HapticService.success();
              showAlert('Sucesso', 'Dados de teste gerados com sucesso!', [{ text: 'OK' }]);
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
    showAlert(
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

  const cadastrosItems = [
    {
      icon: 'list',
      title: 'Gerenciar Categorias',
      subtitle: 'Criar e editar categorias personalizadas',
      onPress: async () => {
        await HapticService.buttonPress();
        navigation.navigate('Categories');
      },
    },
  ];

  const helpItems = [
    {
      icon: 'help-circle',
      title: 'Tour do App',
      subtitle: 'Revisar recursos e funcionalidades',
      onPress: async () => {
        await HapticService.buttonPress();
        navigation.navigate('Onboarding');
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
  ];

  const dataItems = [
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


        {/* Configurações */}
        <View style={styles.cardContainer}>
          <CardHeader 
            title="Configurações" 
            icon="settings"
          />
          <View style={styles.cardBody}>
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
          </View>
        </View>

        {/* Cadastros */}
        <View style={styles.cardContainer}>
          <CardHeader 
            title="Cadastros" 
            icon="folder"
          />
          <View style={styles.cardBody}>
            {cadastrosItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              disabled={isLoading}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={20} 
                    color={colors.primary} 
                  />
                </View>
                <View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
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
          </View>
        </View>

        {/* Ajuda e Ferramentas */}
        <View style={styles.cardContainer}>
          <CardHeader 
            title="Ajuda e Ferramentas" 
            icon="help-circle"
          />
          <View style={styles.cardBody}>
            {helpItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              disabled={isLoading}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={20} 
                    color={colors.primary} 
                  />
                </View>
                <View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
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
          </View>
        </View>

        {/* Dados e Backup */}
        <View style={styles.cardContainer}>
          <CardHeader 
            title="Dados e Backup" 
            icon="server"
          />
          <View style={styles.cardBody}>
            {dataItems.map((item, index) => (
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
          </View>
        </View>

        {/* Informações do app */}
        <View style={styles.cardContainer}>
          <CardHeader 
            title="Sobre o App" 
            icon="information-circle"
          />
          <View style={styles.cardBody}>
            <View style={styles.appInfo}>
            <Text style={styles.appName}>App Despesas</Text>
            <Text style={styles.appVersion}>Versão 1.0.0</Text>
            <Text style={styles.appDescription}>
              Controle financeiro com foco em parcelamentos
            </Text>
          </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Web Alert Component */}
      {AlertComponent}
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
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 0,
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
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
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
    padding: 16,
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