import React, { useEffect } from 'react';
import { View, Platform, StatusBar as RNStatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';

// Services
import { StorageService, SyncService } from './src/services/core';

// Config
import { getFullSyncConfig } from './src/config/sync';

// Components
import { SyncStatusIndicator } from './src/components/common/SyncStatusIndicator';

// Screens - Nova estrutura plana otimizada
import {
  HomeScreen,
  RecordsScreen,
  ReportsScreen,
  ProfileScreen,
  AddTransactionScreen,
  AddInstallmentScreen,
  AddSubscriptionScreen,
  SelectTransactionTypeScreen,
  EditTransactionScreen,
  EditInstallmentScreen,
  EditSubscriptionScreen,
  InstallmentDetailScreen,
  InstallmentsScreen,
  SubscriptionsScreen,
  TransactionsScreen,
  SubscriptionDetailScreen,
  ExportScreen,
  CategoriesScreen,
  CategoryTransactionsScreen,
  SplashScreen,
  OnboardingScreen,
  AboutScreen
} from './src/screens';

// Theme
import { ThemeProvider } from './src/contexts/ThemeContext';
import { useColors } from './src/hooks/useColors';
import { useTheme } from './src/contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Transactions') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Records') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: focused ? colors.primary + '15' : 'transparent',
            }}>
              <Ionicons name={iconName} size={focused ? 22 : 20} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -3,
          },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -5,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transações',
        }}
      />
      <Tab.Screen 
        name="Records" 
        component={RecordsScreen}
        options={{
          tabBarLabel: 'Registros',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{
          tabBarLabel: 'Relatórios',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const colors = useColors();
  const { isDarkMode } = useTheme();
  
  useEffect(() => {
    // Configurar a barra de navegação do sistema Android
    if (Platform.OS === 'android') {
      const configureNavigationBar = async () => {
        try {
          console.log('Configurando navigation bar...');
          
          // Aguardar um pouco para o app inicializar completamente
          setTimeout(async () => {
            try {
              await NavigationBar.setBackgroundColorAsync('#000000');
              await NavigationBar.setButtonStyleAsync('light');
              console.log('✅ Navigation bar configurada: fundo preto, botões claros');
            } catch (error) {
              console.error('❌ Erro ao configurar navigation bar:', error);
            }
          }, 1000);
          
        } catch (error) {
          console.error('Erro inicial:', error);
        }
      };
      
      configureNavigationBar();
    }
  }, []);
  
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <SyncStatusIndicator showText={false} showSyncButton={false} />
        <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AddTransaction" 
          component={AddTransactionScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="AddInstallment" 
          component={AddInstallmentScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="AddSubscription" 
          component={AddSubscriptionScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="SelectTransactionType" 
          component={SelectTransactionTypeScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="EditTransaction" 
          component={EditTransactionScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="EditInstallment" 
          component={EditInstallmentScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="EditSubscription" 
          component={EditSubscriptionScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="Installments" 
          component={InstallmentsScreen}
          options={{ 
            title: 'Parcelamentos',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="Subscriptions" 
          component={SubscriptionsScreen}
          options={{ 
            title: 'Assinaturas',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="Transactions" 
          component={TransactionsScreen}
          options={{ 
            title: 'Transações',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="InstallmentDetail" 
          component={InstallmentDetailScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="SubscriptionDetail" 
          component={SubscriptionDetailScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="Export" 
          component={ExportScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="Categories" 
          component={CategoriesScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="CategoryTransactions" 
          component={CategoryTransactionsScreen}
          options={{ 
            headerShown: false
          }}
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen}
          options={{ 
            headerShown: false
          }}
        />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  useEffect(() => {
    // Inicializa serviços na inicialização do app
    const initializeServices = async () => {
      try {
        console.log('🚀 Inicializando serviços...');
        
        // Inicializa StorageService
        await StorageService.initialize();
        console.log('✅ StorageService inicializado');
        
        // Inicializa SyncService com configuração baseada no ambiente
        const syncConfig = await getFullSyncConfig();
        await SyncService.initialize(syncConfig);
        console.log('✅ SyncService inicializado');
        
      } catch (error) {
        console.error('❌ Erro ao inicializar serviços:', error);
      }
    };

    initializeServices();
  }, []);

  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}