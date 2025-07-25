import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ViewStyle
} from 'react-native';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  loadingText?: string;
  error?: string | null;
  retry?: () => void;
  retryText?: string;
  empty?: boolean;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  style?: ViewStyle;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  children,
  skeleton,
  loadingText = 'Carregando...',
  error,
  retry,
  retryText = 'Tentar Novamente',
  empty = false,
  emptyIcon = 'folder-open',
  emptyTitle = 'Nenhum dado encontrado',
  emptyMessage = 'Não há informações para exibir no momento',
  style
}) => {
  // Estado de erro
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Ops! Algo deu errado</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          {retry && (
            <TouchableOpacity style={styles.retryButton} onPress={retry}>
              <Ionicons name="refresh" size={16} color={colors.white} />
              <Text style={styles.retryText}>{retryText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Estado de carregamento
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        {skeleton ? (
          skeleton
        ) : (
          <View style={[styles.centerContent, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{loadingText}</Text>
          </View>
        )}
      </View>
    );
  }

  // Estado vazio
  if (empty) {
    return (
      <View style={[styles.container, styles.centerContent, style]}>
        <View style={styles.emptyContainer}>
          <Ionicons name={emptyIcon as any} size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyMessage}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  // Conteúdo normal
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

// Hook para gerenciar estados de loading
export const useLoadingState = (initialLoading = false) => {
  const [loading, setLoading] = React.useState(initialLoading);
  const [error, setError] = React.useState<string | null>(null);

  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setLoading(false);
  };

  const setErrorState = (errorMessage: string) => {
    setLoading(false);
    setError(errorMessage);
  };

  const reset = () => {
    setLoading(false);
    setError(null);
  };

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setErrorState,
    reset
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});