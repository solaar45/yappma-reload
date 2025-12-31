import { useState } from 'react';
import { apiClient } from '../client';

export function useDeleteAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAccount = async (accountId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient(`/accounts/${accountId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteAccount, loading, error };
}

export function useDeleteAsset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteAsset = async (assetId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient(`/assets/${assetId}`, {
        method: 'DELETE',
      });
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
