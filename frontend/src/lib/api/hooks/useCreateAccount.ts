import { useState } from 'react';
import { apiClient } from '../client';
import type { Account } from '../types';

interface CreateAccountData {
  user_id: number;
  name: string;
  type?: string;
  currency?: string;
  institution_id?: number;
}

export function useCreateAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccount = async (data: CreateAccountData): Promise<Account | null> => {
    setLoading(true);
    setError(null);

    try {
      const account = await apiClient.post<Account>('/accounts', {
        account: {
          ...data,
          type: data.type || 'checking',
          currency: data.currency || 'EUR',
        },
      });
      return account;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createAccount, loading, error };
}
