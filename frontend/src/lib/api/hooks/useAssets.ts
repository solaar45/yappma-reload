import { useState, useEffect } from 'react';
import { apiClient, ApiError, DeduplicationError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Asset } from '../types';

interface UseAssetsOptions {
  userId: number;
  key?: number;
}

interface UseAssetsResult {
  assets: Asset[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useAssets({ userId, key }: UseAssetsOptions): UseAssetsResult {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchAssets() {
      try {
        setLoading(true);
        setError(null);

        logger.debug('Fetching assets...', { userId });

        const query = new URLSearchParams();
        if (userId) query.append('user_id', userId.toString());

        const response = await apiClient.get<{ data: Asset[] }>(`assets?${query.toString()}`, {
          signal: controller.signal,
        });

        logger.debug('Assets API response:', response);

        if (isMounted) {
          // The apiClient already unwraps the response, so response.data contains the assets array
          // But the API returns { data: [...] }, so we need response.data
          let assetsData: Asset[];

          if (Array.isArray(response)) {
            // Response is already an array
            assetsData = response;
          } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
            // Response is { data: [...] }
            assetsData = response.data;
          } else {
            // Fallback
            logger.warn('Unexpected response format:', response);
            assetsData = [];
          }

          logger.info('Assets loaded', { count: assetsData.length });
          logger.debug('First asset:', assetsData[0]);
          logger.debug('First asset snapshots:', assetsData[0]?.snapshots);
          logger.debug('First asset account:', assetsData[0]?.account);

          setAssets(assetsData);
        }
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err instanceof DeduplicationError)) {
          logger.debug('Assets fetch cancelled/deduplicated');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError ? err : new Error('Failed to fetch assets');
          setError(error);
          logger.error('Failed to fetch assets', { error, userId });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      fetchAssets();
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

  return { assets, loading, error, refetch };
}
