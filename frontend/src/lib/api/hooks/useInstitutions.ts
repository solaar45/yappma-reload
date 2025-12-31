import { useState, useEffect } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
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

/**
 * Hook to fetch institutions with proper cleanup and error handling
 * 
 * Note: Institutions backend is not yet implemented, returns empty array
 * 
 * Features:
 * - Automatic request cancellation on unmount
 * - Loading and error states
 * - Manual refetch capability
 * - Type-safe API responses
 */
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
        
        // Backend returns { data: [] } - not yet implemented
        const response = await apiClient.get<{ data: Institution[] }>('institutions', {
          signal: controller.signal,
        });

        // Only update state if component is still mounted
        if (isMounted) {
          // Extract data array from response
          const institutionsData = Array.isArray(response) ? response : response.data;
          setInstitutions(institutionsData || []);
          logger.info('Institutions loaded', { count: institutionsData?.length || 0 });
        }
      } catch (err) {
        // Don't set error state if request was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          logger.debug('Institutions fetch cancelled');
          return;
        }

        if (isMounted) {
          const error = err instanceof ApiError 
            ? err 
            : new Error('Failed to fetch institutions');
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

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userId, key, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return {
    institutions,
    loading,
    error,
    refetch,
  };
}
