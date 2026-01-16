import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface AssetAllocation {
  asset_type: 'cash' | 'security' | 'insurance' | 'loan' | 'real_estate' | 'other';
  value: string;
  percentage: number;
  count: number;
}

interface UseAssetAllocationParams {
  userId: number;
  date?: string;
}

export function useAssetAllocation({ userId, date }: UseAssetAllocationParams) {
  const [data, setData] = useState<AssetAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const params = new URLSearchParams({ user_id: userId.toString() });
        if (date) params.append('date', date);
        
        const response = await apiClient.get<{ data: { allocation: AssetAllocation[] } }>(
          `dashboard/asset_allocation?${params}`
        );
        
        setData(response.data.allocation);
        logger.info('Asset allocation loaded', { count: response.data.allocation.length });
      } catch (err) {
        setError(err as Error);
        logger.error('Failed to fetch asset allocation', { error: err });
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchData();
    }
  }, [userId, date]);

  return { data, loading, error };
}
