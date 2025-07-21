import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

// Telas
import HomeScreen from './src/screens/HomeScreen';
import AddExpenseScreen from './src/screens/AddExpenseScreen';
import EditExpenseScreen from './src/screens/EditExpenseScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MasterRecordsScreen from './src/screens/MasterRecordsScreen';

// Contexto
import { FinanceProvider } from './src/context/FinanceContext';
import { SettingsProvider } from './src/context/SettingsContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }} edges={['bottom', 'left', 'right']}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Início') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Despesas') {
              iconName = focused ? 'list' : 'list-outline';
            } else if (route.name === 'Relatórios') {
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
            } else if (route.name === 'Configurações') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#9E9E9E',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -4,
            },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
            borderRadius: 20,
            marginHorizontal: 16,
            marginBottom: 8,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarSafeAreaInsets: { bottom: 0 },
        })}
      >
        <Tab.Screen name="Início" component={HomeScreen} />
        <Tab.Screen name="Despesas" component={ExpensesScreen} />
        <Tab.Screen name="Relatórios" component={ReportsScreen} />
        <Tab.Screen name="Configurações" component={SettingsScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export default function App() {
  const colorScheme = useColorScheme();
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  
  const navigationTheme = {
    dark: colorScheme === 'dark',
    colors: {
      primary: paperTheme.colors.primary,
      background: paperTheme.colors.background,
      card: paperTheme.colors.surface,
      text: paperTheme.colors.onSurface,
      border: paperTheme.colors.outline,
      notification: paperTheme.colors.error,
    },
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <FinanceProvider>
          <SettingsProvider>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent />
              <Stack.Navigator>
                <Stack.Screen 
                  name="Main" 
                  component={TabNavigator} 
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="AddExpense" 
                  component={AddExpenseScreen}
                  options={{ 
                    headerShown: false,
                  }}
                />
                <Stack.Screen 
                  name="EditExpense" 
                  component={EditExpenseScreen}
                  options={{ 
                    headerShown: false,
                  }}
                />
                <Stack.Screen 
                  name="MasterRecords" 
                  component={MasterRecordsScreen}
                  options={{ 
                    headerShown: false,
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SettingsProvider>
        </FinanceProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 