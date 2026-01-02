import { useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { FintsTestResult } from '@/lib/api/types';

interface TestConnectionParams {
  blz: string;
  user_id: string;
  pin: string;
  fints_url: string;
}

interface UseTestConnectionResult {
  testConnection: (params: TestConnectionParams) => Promise<FintsTestResult>;
  isLoading: boolean;
  error: Error | null;
}

export function useTestConnection(): UseTestConnectionResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const testConnection = async (params: TestConnectionParams): Promise<FintsTestResult> => {
    try {
      setIsLoading(true);
      setError(null);

      logger.debug('Testing FinTS connection...', { blz: params.blz });

      const response = await apiClient.post<FintsTestResult>('bank_connections/test', params);

      logger.info('Connection test completed', { success: response.success });
      return response;
    } catch (err) {
      const error = err instanceof ApiError ? err : new Error('Connection test failed');
      setError(error);
      logger.error('Connection test failed', { error });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { testConnection, isLoading, error };
}
