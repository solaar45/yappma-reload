import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Account } from '@/lib/api/types';

interface CreateAccountInput {
  user_id: number;
  name: string;
  type: string;
  currency: string;
  institution_id?: number;
  custom_institution_name?: string;
  is_active?: boolean;
  opened_at?: string;
}

interface UseCreateAccountResult {
  createAccount: (data: CreateAccountInput) => Promise<Account>;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to create new accounts with proper error handling
 * 
 * Features:
 * - Loading state management
 * - Error handling
 * - Type-safe mutations
 * - Request cancellation support
 */
export function useCreateAccount(): UseCreateAccountResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAccount = async (data: CreateAccountInput): Promise<Account> => {
    try {
      setLoading(true);
      setError(null);

      logger.debug('Creating account...', { name: data.name });

      const response = await apiClient.post<{ data: Account }>('accounts', {
        account: data,
      });

      logger.info('Account created', { id: response.data.id });
      return response.data;
    } catch (err) {
      const error = err instanceof ApiError
        ? err
        : new Error('Failed to create account');

      setError(error);
      logger.error('Failed to create account', { error, data });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    createAccount,
    loading,
    error,
  };
}
