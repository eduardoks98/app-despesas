import { useState, useCallback } from 'react';
import { HapticService } from '../services/platform';

interface UseRefreshOptions {
  onRefresh: () => Promise<void> | void;
  initialRefreshing?: boolean;
}

export const useRefresh = ({ onRefresh, initialRefreshing = false }: UseRefreshOptions) => {
  const [refreshing, setRefreshing] = useState(initialRefreshing);

  const handleRefresh = useCallback(async () => {
    await HapticService.refresh();
    setRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
};

// Hook para refresh com debounce (evita múltiplos refreshes seguidos)
export const useDebouncedRefresh = ({ 
  onRefresh, 
  initialRefreshing = false,
  debounceMs = 1000 
}: UseRefreshOptions & { debounceMs?: number }) => {
  const [refreshing, setRefreshing] = useState(initialRefreshing);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);

  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    if (now - lastRefreshTime < debounceMs) {
      return; // Evita refresh muito frequente
    }

    await HapticService.refresh();
    setRefreshing(true);
    setLastRefreshTime(now);
    
    try {
      await Promise.resolve(onRefresh());
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, debounceMs, lastRefreshTime]);

  return {
    refreshing,
    onRefresh: handleRefresh,
  };
};