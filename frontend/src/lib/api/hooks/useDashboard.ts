import { useState, useEffect } from 'react';
import { apiClient } from '../client';
import type { NetWorth, SnapshotCollection } from '../types';

interface UseDashboardOptions {
  userId: number;
}

export function useDashboard({ userId }: UseDashboardOptions) {
  const [netWorth, setNetWorth] = useState<NetWorth | null>(null);
  const [accountSnapshots, setAccountSnapshots] = useState<SnapshotCollection | null>(null);
  const [assetSnapshots, setAssetSnapshots] = useState<SnapshotCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all dashboard data in parallel
        const [netWorthData, accountSnapshotsData, assetSnapshotsData] = await Promise.all([
          apiClient.get<NetWorth>('/dashboard/net_worth', { user_id: userId }),
          apiClient.get<SnapshotCollection>('/dashboard/account_snapshots', { user_id: userId }),
          apiClient.get<SnapshotCollection>('/dashboard/asset_snapshots', { user_id: userId }),
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

    if (userId) {
      fetchDashboard();
    }
  }, [userId]);

  return {
    netWorth,
    accountSnapshots,
    assetSnapshots,
    loading,
    error,
  };
}
