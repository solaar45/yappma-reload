import { useState, useEffect } from 'react';
import { apiClient } from '../client';
import type { Account } from '../types';

interface UseAccountsOptions {
  userId: number;
  key?: number;
}

export function useAccounts({ userId, key }: UseAccountsOptions) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<Account[]>('/accounts', {
          user_id: userId,
        });
        setAccounts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAccounts();
    }
  }, [userId, key]);

  return { accounts, loading, error };
}
