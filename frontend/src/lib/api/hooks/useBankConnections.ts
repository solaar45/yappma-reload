import { useState, useEffect } from 'react';
import { apiClient, ApiError, DeduplicationError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { BankConnection } from '@/lib/api/types';

interface UseBankConnectionsResult {
  connections: BankConnection[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBankConnections(): UseBankConnectionsResult {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchConnections() {
      try {
        setIsLoading(true);
        setError(null);

        logger.debug('Fetching bank connections...');

        const response = await apiClient.get<{ data: BankConnection[] }>('bank_connections', {
          signal: controller.signal,
        });

        if (isMounted) {
          const data = Array.isArray(response) ? response : (response?.data || []);
          setConnections(data);
          logger.info('Bank connections loaded', { count: data?.length || 0 });
        }
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err instanceof DeduplicationError)) {
          logger.debug('Bank connections fetch cancelled/deduplicated');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError ? err : new Error('Failed to fetch bank connections');
          setError(error);
          logger.error('Failed to fetch bank connections', { error });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchConnections();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [refetchTrigger]);

  const refetch = () => {
    logger.debug('Manual refetch triggered');
    setRefetchTrigger(prev => prev + 1);
  };

  return { connections, isLoading, error, refetch };
}
