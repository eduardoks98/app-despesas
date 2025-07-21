import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Screens
import { HomeScreen } from './src/screens/Home/HomeScreen';
import { RecordsScreen } from './src/screens/Records/RecordsScreen';
import { ReportsScreen } from './src/screens/Reports/ReportsScreen';
import { ProfileScreen } from './src/screens/Profile/ProfileScreen';
import { AddTransactionScreen } from './src/screens/AddTransaction/AddTransactionScreen';
import { AddInstallmentScreen } from './src/screens/AddInstallment/AddInstallmentScreen';
import { AddSubscriptionScreen } from './src/screens/AddSubscription/AddSubscriptionScreen';
import { SelectTransactionTypeScreen } from './src/screens/SelectTransactionType/SelectTransactionTypeScreen';
import { EditTransactionScreen } from './src/screens/EditTransaction/EditTransactionScreen';
import { EditInstallmentScreen } from './src/screens/EditInstallment/EditInstallmentScreen';
import { InstallmentDetailScreen } from './src/screens/InstallmentDetail/InstallmentDetailScreen';
import { SubscriptionDetailScreen } from './src/screens/SubscriptionDetail/SubscriptionDetailScreen';
import { ExportScreen } from './src/screens/Export/ExportScreen';
import { SplashScreen } from './src/screens/Splash/SplashScreen';
import { OnboardingScreen } from './src/screens/Onboarding/OnboardingScreen';

// Theme
import { ThemeProvider } from './src/contexts/ThemeContext';
import { useColors } from './src/hooks/useColors';
import { useTheme } from './src/contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  const colors = useColors();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Records') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
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
  
  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
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
            title: 'Nova Transação',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="AddInstallment" 
          component={AddInstallmentScreen}
          options={{ 
            title: 'Novo Parcelamento',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="AddSubscription" 
          component={AddSubscriptionScreen}
          options={{ 
            title: 'Nova Assinatura',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="SelectTransactionType" 
          component={SelectTransactionTypeScreen}
          options={{ 
            title: 'Tipo de Transação',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="EditTransaction" 
          component={EditTransactionScreen}
          options={{ 
            title: 'Editar Transação',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="EditInstallment" 
          component={EditInstallmentScreen}
          options={{ 
            title: 'Editar Parcelamento',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="InstallmentDetail" 
          component={InstallmentDetailScreen}
          options={{ 
            title: 'Detalhes do Parcelamento',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="SubscriptionDetail" 
          component={SubscriptionDetailScreen}
          options={{ 
            title: 'Detalhes da Assinatura',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
          }}
        />
        <Stack.Screen 
          name="Export" 
          component={ExportScreen}
          options={{ 
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}