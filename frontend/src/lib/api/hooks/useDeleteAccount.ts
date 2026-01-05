import { useState } from 'react';
import { apiClient, ApiError } from '../client';
import { logger } from '@/lib/logger';

export function useDeleteAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteAccount = async (accountId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('Deleting account...', { accountId });

      await apiClient.delete(`accounts/${accountId}`);

      logger.info('Account deleted successfully', { accountId });
      return true;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error('Failed to delete account');
      setError(error);
      logger.error('Failed to delete account', { error, accountId });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteAccount, loading, error };
}

export function useDeleteAsset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteAsset = async (assetId: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('Deleting asset...', { assetId });

      await apiClient.delete(`assets/${assetId}`);

      logger.info('Asset deleted successfully', { assetId });
      return true;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error('Failed to delete asset');
      setError(error);
      logger.error('Failed to delete asset', { error, assetId });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteAsset, loading, error };
}
