import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { FintsFetchAccountsResult } from '@/lib/api/types';

interface UseFetchAccountsResult {
  fetchAccounts: (connectionId: number) => Promise<FintsFetchAccountsResult>;
  isLoading: boolean;
  error: Error | null;
}

export function useFetchAccounts(): UseFetchAccountsResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = async (connectionId: number): Promise<FintsFetchAccountsResult> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.debug('Fetching accounts from FinTS...', { connectionId });

      const response = await apiClient.post<FintsFetchAccountsResult>(
        `bank_connections/${connectionId}/fetch_accounts`,
        {}
      );

      logger.info('Accounts fetched', { success: response.success, count: response.accounts?.length || 0 });
      return response;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error('Failed to fetch accounts');
      setError(error);
      logger.error('Failed to fetch accounts', { error });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchAccounts, isLoading, error };
}
