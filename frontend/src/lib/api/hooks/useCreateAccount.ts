import { useState } from 'react';
import { apiClient } from '../client';
import type { Account } from '../types';

interface CreateAccountParams {
  user_id: number;
  institution_id?: number;
  account_type_id?: number;
  name: string;
  iban?: string;
}

export function useCreateAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAccount = async (params: CreateAccountParams): Promise<Account | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient<Account>('/accounts', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createAccount, loading, error };
}
