import { useState } from 'react';
import { apiClient } from '../client';
import type { AccountSnapshot, AssetSnapshot } from '../types';

type SnapshotType = 'account' | 'asset';

interface CreateAccountSnapshotParams {
  account_id: number;
  balance: string;
  currency: string;
  snapshot_date: string;
}

interface CreateAssetSnapshotParams {
  asset_id: number;
  value: string;
  quantity?: string;
  snapshot_date: string;
}

export function useCreateSnapshot(type: SnapshotType) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSnapshot = async (
    params: CreateAccountSnapshotParams | CreateAssetSnapshotParams
  ): Promise<AccountSnapshot | AssetSnapshot | null> => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = type === 'account' ? '/snapshots/accounts' : '/snapshots/assets';
      const data = await apiClient<AccountSnapshot | AssetSnapshot>(endpoint, {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create snapshot';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createSnapshot, loading, error };
}
