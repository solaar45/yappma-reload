import { useState, useEffect } from 'react';
import { apiClient } from '../client';
import type { Asset } from '../types';

export function useAssets(userId: number) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<Asset[]>('/assets', {
          user_id: userId,
        });
        setAssets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [userId]);

  return { assets, loading, error };
}