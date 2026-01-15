import { useState, useEffect } from 'react';
import { apiClient, ApiError, DeduplicationError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { AccountSnapshot, AssetSnapshot, Account, Asset } from '../types';

interface UseSnapshotsParams {
  userId: number;
  key?: number;
}

export type CombinedSnapshot =
  | (AccountSnapshot & { snapshot_type: 'account'; entity_name: string; entity_subtype?: string })
  | (AssetSnapshot & { snapshot_type: 'asset'; entity_name: string; entity_subtype?: string });

interface UseSnapshotsResult {
  snapshots: CombinedSnapshot[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

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

        const query = new URLSearchParams();
        if (userId) query.append('user_id', userId.toString());
        const queryString = query.toString() ? `?${query.toString()}` : '';

        const [accountsResponse, assetsResponse] = await Promise.all([
          apiClient.get<{ data: Account[] }>(`accounts${queryString}`, { signal: controller.signal }),
          apiClient.get<{ data: Asset[] }>(`assets${queryString}`, { signal: controller.signal }),
        ]);

        if (!isMounted) return;

        const accounts = Array.isArray(accountsResponse) ? accountsResponse : accountsResponse.data || [];
        const assets = Array.isArray(assetsResponse) ? assetsResponse : assetsResponse.data || [];

        const accountSnapshots: CombinedSnapshot[] = accounts.flatMap(
          (account) =>
            (account.snapshots || []).map((snapshot: AccountSnapshot) => ({
              ...snapshot,
              snapshot_type: 'account' as const,
              entity_name: account.name,
              entity_subtype: account.type,
            }))
        );

        const assetSnapshots: CombinedSnapshot[] = assets.flatMap(
          (asset) =>
            (asset.snapshots || []).map((snapshot: AssetSnapshot) => ({
              ...snapshot,
              snapshot_type: 'asset' as const,
              entity_name: asset.name,
              entity_subtype: asset.asset_type?.code,
            }))
        );

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
        if (err instanceof Error && (err.name === 'AbortError' || err instanceof DeduplicationError)) {
          logger.debug('Snapshots fetch cancelled/deduplicated');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError ? err : new Error('Failed to fetch snapshots');
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
