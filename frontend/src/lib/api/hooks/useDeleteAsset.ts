import { useState } from 'react';
import { apiClient } from '../client';

export function useDeleteAsset() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const deleteAsset = async (id: number): Promise<boolean> => {
        setLoading(true);
        setError(null);

        try {
            await apiClient.delete(`assets/${id}`);
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete asset';
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { deleteAsset, loading, error };
}
