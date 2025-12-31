import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Account, Asset } from '../types';

interface UseDashboardParams {
  userId: number;
  key?: number;
}

interface DashboardData {
  accounts: Account[];
  assets: Asset[];
  totalValue: string;
  accountsValue: string;
  assetsValue: string;
}

interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch dashboard data (accounts + assets) with proper cleanup
 * 
 * Features:
 * - Automatic request cancellation on unmount
 * - Calculates total portfolio value
 * - Parallel fetching for performance
 * - Type-safe API responses
 */
export function useDashboard({ userId, key = 0 }: UseDashboardParams): UseDashboardResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        logger.debug('Fetching dashboard data...', { userId });

        // Fetch accounts and assets in parallel
        const [accountsResponse, assetsResponse] = await Promise.all([
          apiClient.get<{ data: Account[] }>('accounts', {
            signal: controller.signal,
          }),
          apiClient.get<{ data: Asset[] }>('assets', {
            signal: controller.signal,
          }),
        ]);

        // Only process if component is still mounted
        if (!isMounted) return;

        // Extract data arrays from response (handle both formats)
        const accounts = Array.isArray(accountsResponse)
          ? accountsResponse
          : accountsResponse.data || [];
        const assets = Array.isArray(assetsResponse)
          ? assetsResponse
          : assetsResponse.data || [];

        // Calculate total values from latest snapshots
        const accountsValue = accounts.reduce((sum, account) => {
          const latestSnapshot = account.snapshots?.[0];
          const value = latestSnapshot?.balance ? parseFloat(latestSnapshot.balance) : 0;
          return sum + value;
        }, 0);

        const assetsValue = assets.reduce((sum, asset) => {
          const latestSnapshot = asset.snapshots?.[0];
          const value = latestSnapshot?.value ? parseFloat(latestSnapshot.value) : 0;
          return sum + value;
        }, 0);

        const totalValue = accountsValue + assetsValue;

        if (isMounted) {
          setData({
            accounts,
            assets,
            totalValue: totalValue.toFixed(2),
            accountsValue: accountsValue.toFixed(2),
            assetsValue: assetsValue.toFixed(2),
          });
          logger.info('Dashboard data loaded', {
            accounts: accounts.length,
            assets: assets.length,
            totalValue,
          });
        }
      } catch (err) {
        // Don't set error state if request was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          logger.debug('Dashboard fetch cancelled');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError
            ? err
            : new Error('Failed to fetch dashboard data');
          setError(error);
          logger.error('Failed to fetch dashboard data', { error, userId });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userId, key, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}
