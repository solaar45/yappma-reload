import { useState } from 'react';
import { apiClient } from '../client';
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
  const [error, setError] = useState<string | null>(null);

  const updateAccount = async (
    accountId: number,
    params: UpdateAccountParams
  ): Promise<Account | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient<Account>(`/accounts/${accountId}`, {
        method: 'PUT',
        body: JSON.stringify(params),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update account';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateAccount, loading, error };
}

export function useUpdateAsset() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAsset = async (
    assetId: number,
    params: UpdateAssetParams
  ): Promise<Asset | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient<Asset>(`/assets/${assetId}`, {
        method: 'PUT',
        body: JSON.stringify(params),
      });
      return data;
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
