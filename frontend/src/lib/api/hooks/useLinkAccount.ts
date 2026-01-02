import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface LinkAccountParams {
  account_id: number;
}

interface UseLinkAccountResult {
  linkAccount: (bankAccountId: number, params: LinkAccountParams) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export function useLinkAccount(): UseLinkAccountResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const linkAccount = async (bankAccountId: number, params: LinkAccountParams): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.debug('Linking bank account...', { bankAccountId, accountId: params.account_id });

      await apiClient.post(`bank_accounts/${bankAccountId}/link`, params);

      logger.info('Bank account linked successfully');
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error('Failed to link account');
      setError(error);
      logger.error('Failed to link account', { error });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { linkAccount, isLoading, error };
}
