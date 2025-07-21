import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipos
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface SettingsState {
  categories: Category[];
  notificationsEnabled: boolean;
  autoBackupEnabled: boolean;
  darkModeEnabled: boolean;
  loading: boolean;
}

type SettingsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_NOTIFICATIONS'; payload: boolean }
  | { type: 'SET_AUTO_BACKUP'; payload: boolean }
  | { type: 'SET_DARK_MODE'; payload: boolean };

const defaultCategories: Category[] = [
  { id: '1', name: 'Alimentação', icon: 'restaurant', color: '#FF6384' },
  { id: '2', name: 'Transporte', icon: 'car', color: '#36A2EB' },
  { id: '3', name: 'Moradia', icon: 'home', color: '#FFCE56' },
  { id: '4', name: 'Saúde', icon: 'medical', color: '#4BC0C0' },
  { id: '5', name: 'Educação', icon: 'school', color: '#9966FF' },
  { id: '6', name: 'Lazer', icon: 'game-controller', color: '#FF9F40' },
  { id: '7', name: 'Vestuário', icon: 'shirt', color: '#FF6384' },
  { id: '8', name: 'Financiamento', icon: 'card', color: '#9C27B0' },
  { id: '9', name: 'Outros', icon: 'ellipsis-horizontal', color: '#C9CBCF' },
];

const initialState: SettingsState = {
  categories: defaultCategories,
  notificationsEnabled: true,
  autoBackupEnabled: true,
  darkModeEnabled: false,
  loading: false,
};

const settingsReducer = (state: SettingsState, action: SettingsAction): SettingsState => {
  console.log('SettingsReducer - Action:', action.type, action.payload);
  
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    
    case 'ADD_CATEGORY':
      console.log('Adding category:', action.payload);
      return { 
        ...state, 
        categories: [...state.categories, action.payload] 
      };
    
    case 'DELETE_CATEGORY':
      console.log('Deleting category with id:', action.payload);
      return {
        ...state,
        categories: state.categories.filter(category => category.id !== action.payload),
      };
    
    case 'SET_NOTIFICATIONS':
      console.log('Setting notifications:', action.payload);
      return { ...state, notificationsEnabled: action.payload };
    
    case 'SET_AUTO_BACKUP':
      console.log('Setting auto backup:', action.payload);
      return { ...state, autoBackupEnabled: action.payload };
    
    case 'SET_DARK_MODE':
      console.log('Setting dark mode:', action.payload);
      return { ...state, darkModeEnabled: action.payload };
    
    default:
      return state;
  }
};

interface SettingsContextType {
  state: SettingsState;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setNotifications: (enabled: boolean) => Promise<void>;
  setAutoBackup: (enabled: boolean) => Promise<void>;
  setDarkMode: (enabled: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  console.log('SettingsProvider - Current state:', state);

  const loadSettings = async () => {
    console.log('Loading settings...');
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const settingsData = await AsyncStorage.getItem('settings');
      console.log('Settings data from storage:', settingsData);
      
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        dispatch({ type: 'SET_CATEGORIES', payload: settings.categories || defaultCategories });
        dispatch({ type: 'SET_NOTIFICATIONS', payload: settings.notificationsEnabled ?? true });
        dispatch({ type: 'SET_AUTO_BACKUP', payload: settings.autoBackupEnabled ?? true });
        dispatch({ type: 'SET_DARK_MODE', payload: settings.darkModeEnabled ?? false });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveSettings = async () => {
    try {
      const settingsData = {
        categories: state.categories,
        notificationsEnabled: state.notificationsEnabled,
        autoBackupEnabled: state.autoBackupEnabled,
        darkModeEnabled: state.darkModeEnabled,
      };
      console.log('Saving settings:', settingsData);
      await AsyncStorage.setItem('settings', JSON.stringify(settingsData));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    console.log('addCategory called with:', categoryData);
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
    };
    
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    await saveSettings();
  };

  const deleteCategory = async (id: string) => {
    console.log('deleteCategory called with id:', id);
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
    await saveSettings();
  };

  const setNotifications = async (enabled: boolean) => {
    console.log('setNotifications called with:', enabled);
    dispatch({ type: 'SET_NOTIFICATIONS', payload: enabled });
    await saveSettings();
  };

  const setAutoBackup = async (enabled: boolean) => {
    console.log('setAutoBackup called with:', enabled);
    dispatch({ type: 'SET_AUTO_BACKUP', payload: enabled });
    await saveSettings();
  };

  const setDarkMode = async (enabled: boolean) => {
    console.log('setDarkMode called with:', enabled);
    dispatch({ type: 'SET_DARK_MODE', payload: enabled });
    await saveSettings();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    console.log('Settings state changed, saving...');
    saveSettings();
  }, [state]);

  const value: SettingsContextType = {
    state,
    addCategory,
    deleteCategory,
    setNotifications,
    setAutoBackup,
    setDarkMode,
    loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
}; 