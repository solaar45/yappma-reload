import { useState } from 'react';
import { apiClient, ApiError } from '../client';
import { logger } from '@/lib/logger';
import type { Account, Asset } from '../types';

interface UpdateAccountParams {
  institution_id?: number;
  account_type_id?: number;
  name?: string;
  iban?: string;
}

interface UpdateAssetParams {
  asset_type_id?: number;
  name?: string;
  isin?: string;
  ticker?: string;
  currency?: string;
}

export function useUpdateAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateAccount = async (
    accountId: number,
    params: UpdateAccountParams
  ): Promise<Account | null> => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('Updating account...', { accountId, params });

      const data = await apiClient.put<Account>(`accounts/${accountId}`, params);

      logger.info('Account updated successfully', { accountId });
      return data;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error('Failed to update account');
      setError(error);
      logger.error('Failed to update account', { error, accountId });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateAccount, loading, error };
}

export function useUpdateAsset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateAsset = async (
    assetId: number,
    params: UpdateAssetParams
  ): Promise<Asset | null> => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('Updating asset...', { assetId, params });

      const data = await apiClient.put<Asset>(`assets/${assetId}`, params);

      logger.info('Asset updated successfully', { assetId });
      return data;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error('Failed to update asset');
      setError(error);
      logger.error('Failed to update asset', { error, assetId });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateAsset, loading, error };
}
