import { useState, useEffect } from 'react';
import { apiClient, ApiError, DeduplicationError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Account } from '@/lib/api/types';

interface UseAccountsOptions {
  userId?: number;
  key?: number;
}

interface UseAccountsResult {
  accounts: Account[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch accounts with proper cleanup and error handling
 */
export function useAccounts(options: UseAccountsOptions = {}): UseAccountsResult {
  const { userId, key } = options;
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

        const query = new URLSearchParams();
        if (userId) query.append('user_id', userId.toString());

        const response = await apiClient.get<{ data: Account[] }>(`accounts?${query.toString()}`, {
          signal: controller.signal,
        });

        if (isMounted) {
          const accountsData = Array.isArray(response) ? response : (response?.data || []);
          setAccounts(accountsData);
          logger.info('Accounts loaded', { count: accountsData?.length || 0 });
        }
      } catch (err) {
        // Ignore AbortError and DeduplicationError
        if (err instanceof Error && (err.name === 'AbortError' || err instanceof DeduplicationError)) {
          logger.debug('Accounts fetch cancelled/deduplicated');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError ? err : new Error('Failed to fetch accounts');
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

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userId, key, refetchTrigger]);

  const refetch = () => {
    logger.debug('Manual refetch triggered');
    setRefetchTrigger(prev => prev + 1);
  };

  return { accounts, isLoading, error, refetch };
}
