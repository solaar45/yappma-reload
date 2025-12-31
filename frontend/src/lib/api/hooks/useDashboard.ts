import { useState, useEffect } from 'react';
import { apiClient } from '../client';
import type {
  NetWorthResponse,
  DashboardAccountSnapshotsResponse,
  DashboardAssetSnapshotsResponse,
} from '../types';

interface UseDashboardOptions {
  userId: number;
  date?: string; // ISO date string, defaults to today
}

export function useDashboard({ userId, date }: UseDashboardOptions) {
  const [netWorth, setNetWorth] = useState<NetWorthResponse | null>(null);
  const [accountSnapshots, setAccountSnapshots] =
    useState<DashboardAccountSnapshotsResponse | null>(null);
  const [assetSnapshots, setAssetSnapshots] =
    useState<DashboardAssetSnapshotsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = { user_id: userId, ...(date && { date }) };

        const [netWorthData, accountSnapshotsData, assetSnapshotsData] =
          await Promise.all([
            apiClient.get<NetWorthResponse>('/dashboard/net_worth', params),
            apiClient.get<DashboardAccountSnapshotsResponse>(
              '/dashboard/account_snapshots',
              params
            ),
            apiClient.get<DashboardAssetSnapshotsResponse>(
              '/dashboard/asset_snapshots',
              params
            ),
          ]);

        setNetWorth(netWorthData);
        setAccountSnapshots(accountSnapshotsData);
        setAssetSnapshots(assetSnapshotsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, date]);

  return {
    netWorth,
    accountSnapshots,
    assetSnapshots,
    loading,
    error,
  };
}