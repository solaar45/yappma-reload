import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Account } from '@/lib/api/types';

interface UseAccountsResult {
  accounts: Account[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch accounts with proper cleanup and error handling
 * 
 * Features:
 * - Automatic request cancellation on unmount
 * - Loading and error states
 * - Manual refetch capability
 * - Type-safe API responses
 */
export function useAccounts(): UseAccountsResult {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchAccounts() {
      try {
        setIsLoading(true);
        setError(null);

        logger.debug('Fetching accounts...');
        
        const response = await apiClient.get<{ data: Account[] }>('accounts', {
          signal: controller.signal,
        });

        // Only update state if component is still mounted
        if (isMounted) {
          setAccounts(response.data);
          logger.info('Accounts loaded', { count: response.data.length });
        }
      } catch (err) {
        // Don't set error state if request was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          logger.debug('Accounts fetch cancelled');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError 
            ? err 
            : new Error('Failed to fetch accounts');
          setError(error);
          logger.error('Failed to fetch accounts', { error });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAccounts();

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return {
    accounts,
    isLoading,
    error,
    refetch,
  };
}
