import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { AccountSnapshot, AssetSnapshot, Account, Asset } from '../types';

interface UseSnapshotsParams {
  userId: number;
  key?: number;
}

export type CombinedSnapshot = 
  | (AccountSnapshot & { snapshot_type: 'account'; entity_name: string })
  | (AssetSnapshot & { snapshot_type: 'asset'; entity_name: string });

interface UseSnapshotsResult {
  snapshots: CombinedSnapshot[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch all snapshots (accounts + assets) with proper cleanup
 * 
 * Features:
 * - Automatic request cancellation on unmount
 * - Combines account and asset snapshots
 * - Sorted by date (newest first)
 * - Type-safe API responses
 */
export function useSnapshots({ userId, key = 0 }: UseSnapshotsParams): UseSnapshotsResult {
  const [snapshots, setSnapshots] = useState<CombinedSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchSnapshots() {
      try {
        setLoading(true);
        setError(null);

        logger.debug('Fetching snapshots...', { userId });

        // Fetch accounts with snapshots
        const accountsResponse = await apiClient.get<{ data: Account[] }>('accounts', {
          signal: controller.signal,
        });

        // Fetch assets with snapshots
        const assetsResponse = await apiClient.get<{ data: Asset[] }>('assets', {
          signal: controller.signal,
        });

        // Only process if component is still mounted
        if (!isMounted) return;

        // Extract data arrays from response (handle both formats)
        const accounts = Array.isArray(accountsResponse) 
          ? accountsResponse 
          : accountsResponse.data || [];
        const assets = Array.isArray(assetsResponse) 
          ? assetsResponse 
          : assetsResponse.data || [];

        // Extract and combine all snapshots
        const accountSnapshots: CombinedSnapshot[] = accounts.flatMap(
          (account) =>
            (account.snapshots || []).map((snapshot: AccountSnapshot) => ({
              ...snapshot,
              snapshot_type: 'account' as const,
              entity_name: account.name,
            }))
        );

        const assetSnapshots: CombinedSnapshot[] = assets.flatMap(
          (asset) =>
            (asset.snapshots || []).map((snapshot: AssetSnapshot) => ({
              ...snapshot,
              snapshot_type: 'asset' as const,
              entity_name: asset.name,
            }))
        );

        // Combine and sort by date (newest first)
        const combined = [...accountSnapshots, ...assetSnapshots].sort(
          (a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
        );

        if (isMounted) {
          setSnapshots(combined);
          logger.info('Snapshots loaded', { 
            total: combined.length,
            accounts: accountSnapshots.length,
            assets: assetSnapshots.length 
          });
        }
      } catch (err) {
        // Don't set error state if request was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          logger.debug('Snapshots fetch cancelled');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError
            ? err
            : new Error('Failed to fetch snapshots');
          setError(error);
          logger.error('Failed to fetch snapshots', { error, userId });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      fetchSnapshots();
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

  return { snapshots, loading, error, refetch };
}
