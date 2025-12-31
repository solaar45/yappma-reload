import { useState, useEffect } from 'react';
import { apiClient } from '../client';
import type { Institution } from '../types';

interface UseInstitutionsParams {
  userId: number;
  key?: number;
}

export function useInstitutions({ userId, key = 0 }: UseInstitutionsParams) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<Institution[]>('/institutions', {
          user_id: userId.toString(),
        });
        setInstitutions(data);
      } catch (err) {
        console.error('Failed to fetch institutions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load institutions');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchInstitutions();
    }
  }, [userId, key]);

  return { institutions, loading, error };
}
