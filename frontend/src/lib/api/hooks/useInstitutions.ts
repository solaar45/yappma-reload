import { useState, useEffect } from 'react';
import { apiClient, ApiError, DeduplicationError } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type { Institution } from '../types';

interface UseInstitutionsOptions {
  userId: number;
  key?: number;
}

interface UseInstitutionsResult {
  institutions: Institution[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useInstitutions({ userId, key }: UseInstitutionsOptions): UseInstitutionsResult {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function fetchInstitutions() {
      try {
        setLoading(true);
        setError(null);

        logger.debug('Fetching institutions...', { userId });

        const query = new URLSearchParams();
        if (userId) query.append('user_id', userId.toString());

        const response = await apiClient.get<{ data: Institution[] }>(`institutions?${query.toString()}`, {
          signal: controller.signal,
        });

        if (isMounted) {
          const institutionsData = Array.isArray(response) ? response : response.data;
          setInstitutions(institutionsData || []);
          logger.info('Institutions loaded', { count: institutionsData?.length || 0 });
        }
      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err instanceof DeduplicationError)) {
          logger.debug('Institutions fetch cancelled/deduplicated');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError ? err : new Error('Failed to fetch institutions');
          setError(error);
          logger.error('Failed to fetch institutions', { error, userId });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      fetchInstitutions();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userId, key, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { institutions, loading, error, refetch };
}
