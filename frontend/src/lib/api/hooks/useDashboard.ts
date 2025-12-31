import { useState, useEffect } from 'react';
import { apiClient } from '../client';
import type { DashboardData } from '../types';

interface UseDashboardOptions {
  userId: number;
}

export function useDashboard({ userId }: UseDashboardOptions) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const dashboardData = await apiClient.get<DashboardData>('/dashboard', {
          user_id: userId,
        });
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDashboard();
    }
  }, [userId]);

  return { data, loading, error };
}
