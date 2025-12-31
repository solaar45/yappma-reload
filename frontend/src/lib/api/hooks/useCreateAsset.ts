import { useState } from 'react';
import { apiClient } from '../client';
import type { Asset } from '../types';

interface CreateAssetData {
  user_id: number;
  asset_type_id: number;
  name: string;
  symbol?: string;
  currency?: string;
  account_id?: number;
  security_asset?: {
    isin?: string;
    ticker?: string;
    wkn?: string;
    exchange?: string;
    sector?: string;
  };
}

export function useCreateAsset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAsset = async (data: CreateAssetData): Promise<Asset | null> => {
    setLoading(true);
    setError(null);

    try {
      const asset = await apiClient.post<Asset>('/assets', {
        asset: {
          ...data,
          currency: data.currency || 'EUR',
        },
      });
      return asset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create asset';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createAsset, loading, error };
}
