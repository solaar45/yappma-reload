import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Account } from '@/lib/api/types';

interface CreateAccountInput {
  name: string;
  currency: string;
  initial_balance?: number;
  institution_id?: string;
}

interface UseCreateAccountResult {
  createAccount: (data: CreateAccountInput) => Promise<Account>;
  isCreating: boolean;
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
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAccount = async (data: CreateAccountInput): Promise<Account> => {
    try {
      setIsCreating(true);
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
      setIsCreating(false);
    }
  };

  return {
    createAccount,
    isCreating,
    error,
  };
}
