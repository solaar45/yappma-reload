import { useState } from 'react';
import { apiClient } from '../client';
import type { Asset } from '../types';

interface CreateAssetParams {
  user_id: number;
  asset_type_id?: number;
  name: string;
  isin?: string;
  ticker?: string;
  currency?: string;
}

export function useCreateAsset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAsset = async (params: CreateAssetParams): Promise<Asset | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient<Asset>('/assets', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create asset';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createAsset, loading, error };
}
