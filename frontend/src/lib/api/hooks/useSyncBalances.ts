import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface SyncResult {
  success: boolean;
  message?: string;
  snapshots_created?: number;
  error?: string;
}

interface UseSyncBalancesResult {
  syncBalances: (connectionId: number) => Promise<SyncResult>;
  isLoading: boolean;
  error: Error | null;
}

export function useSyncBalances(): UseSyncBalancesResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const syncBalances = async (connectionId: number): Promise<SyncResult> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.debug('Syncing balances from FinTS...', { connectionId });

      const response = await apiClient.post<SyncResult>(
        `bank_connections/${connectionId}/sync_balances`,
        {}
      );

      logger.info('Balances synced', { success: response.success, snapshots: response.snapshots_created });
      return response;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error('Failed to sync balances');
      setError(error);
      logger.error('Failed to sync balances', { error });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { syncBalances, isLoading, error };
}
