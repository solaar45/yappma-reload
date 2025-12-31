import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
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

/**
 * Hook to fetch assets with proper cleanup and error handling
 * 
 * Features:
 * - Automatic request cancellation on unmount
 * - Loading and error states
 * - Manual refetch capability
 * - Type-safe API responses
 */
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
        
        // Backend returns { data: [...] }
        const response = await apiClient.get<{ data: Asset[] }>('assets', {
          signal: controller.signal,
        });

        // Only update state if component is still mounted
        if (isMounted) {
          // Extract data array from response
          const assetsData = Array.isArray(response) ? response : response.data;
          setAssets(assetsData || []);
          logger.info('Assets loaded', { count: assetsData?.length || 0 });
        }
      } catch (err) {
        // Don't set error state if request was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          logger.debug('Assets fetch cancelled');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError 
            ? err 
            : new Error('Failed to fetch assets');
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

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userId, key, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return {
    assets,
    loading,
    error,
    refetch,
  };
}
