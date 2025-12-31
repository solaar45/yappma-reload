import { useState, useEffect } from 'react';
import { apiClient } from '../client';
import type { AccountSnapshot, AssetSnapshot } from '../types';

interface UseSnapshotsParams {
  userId: number;
  key?: number;
}

export type CombinedSnapshot = 
  | (AccountSnapshot & { snapshot_type: 'account'; entity_name: string })
  | (AssetSnapshot & { snapshot_type: 'asset'; entity_name: string });

export function useSnapshots({ userId, key = 0 }: UseSnapshotsParams) {
  const [snapshots, setSnapshots] = useState<CombinedSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch accounts with snapshots
        const accounts = await apiClient.get<any[]>('/accounts', {
          user_id: userId.toString(),
        });

        // Fetch assets with snapshots
        const assets = await apiClient.get<any[]>('/assets', {
          user_id: userId.toString(),
        });

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

        setSnapshots(combined);
      } catch (err) {
        console.error('Failed to fetch snapshots:', err);
        setError(err instanceof Error ? err.message : 'Failed to load snapshots');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSnapshots();
    }
  }, [userId, key]);

  return { snapshots, loading, error };
}
