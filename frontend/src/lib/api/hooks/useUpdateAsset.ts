import { useState } from 'react';
import { apiClient } from '../client';
import type { Asset } from '../types';

export function useUpdateAsset() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateAsset = async (id: number, data: Partial<Asset>): Promise<Asset | null> => {
        setLoading(true);
        setError(null);

        try {
            const asset = await apiClient.patch<Asset>(`assets/${id}`, { asset: data });
            return asset;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update asset';
            setError(message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { updateAsset, loading, error };
}
