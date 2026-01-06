import { useState, useEffect } from 'react';
import { apiClient, ApiError, DeduplicationError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Asset } from '../types';

interface UseDashboardParams {
  userId: number;
  key?: number;
}

interface DashboardData {
  assets: Asset[];
  totalValue: string;
}

interface UseDashboardResult {
  data: DashboardData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

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

        const [assetsResponse] = await Promise.all([
          apiClient.get<{ data: Asset[] }>(`assets?user_id=${userId}`, { signal: controller.signal }),
        ]);

        if (!isMounted) return;

        const assets = Array.isArray(assetsResponse) ? assetsResponse : assetsResponse.data || [];

        const totalValue = assets.reduce((sum, asset) => {
          const latestSnapshot = asset.snapshots?.[0];
          const value = latestSnapshot?.value ? parseFloat(latestSnapshot.value) : 0;
          return sum + value;
        }, 0);

        if (isMounted) {
          setData({
            assets,
            totalValue: totalValue.toFixed(2),
          });
          logger.info('Dashboard data loaded', {
            assets: assets.length,
            totalValue,
          });
        }
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err instanceof DeduplicationError)) {
          logger.debug('Dashboard fetch cancelled/deduplicated');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError ? err : new Error('Failed to fetch dashboard data');
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
