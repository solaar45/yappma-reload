import { useState } from 'react';
import { apiClient } from '../client';
import type { AssetSnapshot } from '../types';

interface CreateAssetSnapshotParams {
  asset_id: number;
  value: string;
  quantity?: string;
  snapshot_date: string;
}

export function useCreateSnapshot() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSnapshot = async (
    params: CreateAssetSnapshotParams
  ): Promise<AssetSnapshot | null> => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = 'snapshots/assets';
      const data = await apiClient.post<AssetSnapshot>(endpoint, params);
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
