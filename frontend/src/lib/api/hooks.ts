import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  Account,
  Asset,
  Institution,
  AssetType,
  AccountSnapshot,
  AssetSnapshot,
  NetWorthResponse,
  DashboardAccountSnapshotsResponse,
  DashboardAssetSnapshotsResponse,
  BankConnection,
  BankAccount,
  FintsTestResult,
  FintsFetchAccountsResult,
} from './types';
import { logger } from '../logger';

// Accounts
export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Account[] }>('accounts');
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });
}

export function useAccount(id: number | undefined) {
  return useQuery({
    queryKey: ['accounts', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<{ data: Account }>(`accounts/${id}`);
      return response?.data || response;
    },
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Account>) => {
      const response = await apiClient.post<{ data: Account }>('accounts', data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Account> & { id: number }) => {
      const response = await apiClient.put<{ data: Account }>(`accounts/${id}`, data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

// Assets
export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Asset[] }>('assets');
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });
}

export function useAsset(id: number | undefined) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<{ data: Asset }>(`assets/${id}`);
      return response?.data || response;
    },
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Asset>) => {
      const response = await apiClient.post<{ data: Asset }>('assets', data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Asset> & { id: number }) => {
      const response = await apiClient.put<{ data: Asset }>(`assets/${id}`, data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useDeleteAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

// Institutions
export function useInstitutions() {
  return useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Institution[] }>('institutions');
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });
}

export function useInstitution(id: number | undefined) {
  return useQuery({
    queryKey: ['institutions', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.get<{ data: Institution }>(`institutions/${id}`);
      return response?.data || response;
    },
    enabled: !!id,
  });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Institution>) => {
      const response = await apiClient.post<{ data: Institution }>('institutions', data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Institution> & { id: number }) => {
      const response = await apiClient.put<{ data: Institution }>(`institutions/${id}`, data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });
}

export function useDeleteInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`institutions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    },
  });
}

// Asset Types
export function useAssetTypes() {
  return useQuery({
    queryKey: ['asset-types'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: AssetType[] }>('asset_types');
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });
}

// Account Snapshots
export function useAccountSnapshots(accountId?: number) {
  return useQuery({
    queryKey: ['account-snapshots', accountId],
    queryFn: async () => {
      const params = accountId ? `?account_id=${accountId}` : '';
      const response = await apiClient.get<{ data: AccountSnapshot[] }>(`snapshots/accounts${params}`);
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });
}

export function useCreateAccountSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AccountSnapshot>) => {
      const response = await apiClient.post<{ data: AccountSnapshot }>('snapshots/accounts', data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateAccountSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<AccountSnapshot> & { id: number }) => {
      const response = await apiClient.put<{ data: AccountSnapshot }>(`snapshots/accounts/${id}`, data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteAccountSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`snapshots/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Asset Snapshots
export function useAssetSnapshots(assetId?: number) {
  return useQuery({
    queryKey: ['asset-snapshots', assetId],
    queryFn: async () => {
      const params = assetId ? `?asset_id=${assetId}` : '';
      const response = await apiClient.get<{ data: AssetSnapshot[] }>(`snapshots/assets${params}`);
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });
}

export function useCreateAssetSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AssetSnapshot>) => {
      const response = await apiClient.post<{ data: AssetSnapshot }>('snapshots/assets', data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateAssetSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<AssetSnapshot> & { id: number }) => {
      const response = await apiClient.put<{ data: AssetSnapshot }>(`snapshots/assets/${id}`, data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteAssetSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`snapshots/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Dashboard - Combined hook for dashboard data
export function useDashboard({ userId, key }: { userId: number; key?: number }) {
  return useQuery({
    queryKey: ['dashboard', userId, key],
    queryFn: async () => {
      // Fetch accounts with snapshots
      const accountsResponse = await apiClient.get<{ data: Account[] }>('accounts');
      const accounts = Array.isArray(accountsResponse) ? accountsResponse : (accountsResponse?.data || []);

      // Fetch assets with snapshots
      const assetsResponse = await apiClient.get<{ data: Asset[] }>('assets');
      const assets = Array.isArray(assetsResponse) ? assetsResponse : (assetsResponse?.data || []);

      // Calculate totals
      const accountsValue = accounts.reduce((sum, account) => {
        const latestSnapshot = account.snapshots?.[0];
        return sum + (latestSnapshot ? parseFloat(latestSnapshot.balance) : 0);
      }, 0);

      const assetsValue = assets.reduce((sum, asset) => {
        const latestSnapshot = asset.snapshots?.[0];
        return sum + (latestSnapshot ? parseFloat(latestSnapshot.value) : 0);
      }, 0);

      return {
        accounts,
        assets,
        accountsValue,
        assetsValue,
        totalValue: accountsValue + assetsValue,
      };
    },
    enabled: !!userId,
  });
}

// Snapshots - Combined hook for snapshots page
export function useSnapshots({ userId, key }: { userId: number; key?: number }) {
  return useQuery({
    queryKey: ['snapshots', 'all', userId, key],
    queryFn: async () => {
      try {
        // Fetch account snapshots with account details
        const accountSnapshotsResponse = await apiClient.get<{ data: AccountSnapshot[] }>('snapshots/accounts');
        const accountSnapshots = Array.isArray(accountSnapshotsResponse) 
          ? accountSnapshotsResponse 
          : (accountSnapshotsResponse?.data || []);

        // Fetch asset snapshots with asset details
        const assetSnapshotsResponse = await apiClient.get<{ data: AssetSnapshot[] }>('snapshots/assets');
        const assetSnapshots = Array.isArray(assetSnapshotsResponse) 
          ? assetSnapshotsResponse 
          : (assetSnapshotsResponse?.data || []);

        // Fetch accounts and assets for entity names
        const accountsResponse = await apiClient.get<{ data: Account[] }>('accounts');
        const accounts = Array.isArray(accountsResponse) ? accountsResponse : (accountsResponse?.data || []);

        const assetsResponse = await apiClient.get<{ data: Asset[] }>('assets');
        const assets = Array.isArray(assetsResponse) ? assetsResponse : (assetsResponse?.data || []);

        // Create lookup maps
        const accountsMap = new Map(accounts.map(a => [a.id, a]));
        const assetsMap = new Map(assets.map(a => [a.id, a]));

        // Combine and format snapshots
        const combined = [
          ...accountSnapshots.map(snap => ({
            id: snap.id,
            snapshot_type: 'account' as const,
            snapshot_date: snap.snapshot_date,
            entity_name: accountsMap.get(snap.account_id)?.name || 'Unknown Account',
            balance: snap.balance,
            currency: snap.currency,
          })),
          ...assetSnapshots.map(snap => ({
            id: snap.id,
            snapshot_type: 'asset' as const,
            snapshot_date: snap.snapshot_date,
            entity_name: assetsMap.get(snap.asset_id)?.name || 'Unknown Asset',
            value: snap.value,
            currency: 'EUR',
          })),
        ];

        // Sort by date descending
        combined.sort((a, b) => 
          new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime()
        );

        return combined;
      } catch (error) {
        logger.error('Failed to fetch snapshots', { error });
        throw error;
      }
    },
    enabled: !!userId,
  });
}

export function useDashboardNetWorth() {
  return useQuery({
    queryKey: ['dashboard', 'net-worth'],
    queryFn: async () => {
      const response = await apiClient.get<NetWorthResponse>('dashboard/net_worth');
      return response;
    },
  });
}

export function useDashboardAccountSnapshots() {
  return useQuery({
    queryKey: ['dashboard', 'account-snapshots'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardAccountSnapshotsResponse>('dashboard/account_snapshots');
      return response;
    },
  });
}

export function useDashboardAssetSnapshots() {
  return useQuery({
    queryKey: ['dashboard', 'asset-snapshots'],
    queryFn: async () => {
      const response = await apiClient.get<DashboardAssetSnapshotsResponse>('dashboard/asset_snapshots');
      return response;
    },
  });
}

// Bank Connections (FinTS)
export function useBankConnections() {
  return useQuery({
    queryKey: ['bank-connections'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: BankConnection[] }>('bank_connections');
      return Array.isArray(response) ? response : (response?.data || []);
    },
  });
}

export function useCreateBankConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<BankConnection> & { pin: string }) => {
      const response = await apiClient.post<{ data: BankConnection }>('bank_connections', data);
      return response?.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });
}

export function useDeleteBankConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`bank_connections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: async (credentials: {
      blz: string;
      user_id: string;
      pin: string;
      fints_url: string;
    }) => {
      logger.debug('Testing FinTS connection...', { blz: credentials.blz });
      const response = await apiClient.post<FintsTestResult>('bank_connections/test', credentials);
      logger.info('Connection test completed', { success: response.success });
      return response;
    },
  });
}

export function useFetchAccounts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: number) => {
      logger.debug('Fetching bank accounts...', { connectionId });
      const response = await apiClient.post<FintsFetchAccountsResult>(
        `bank_connections/${connectionId}/fetch_accounts`,
        {}
      );
      logger.info('Bank accounts fetched', { success: response.success });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });
}

export function useSyncBalances() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: number) => {
      logger.debug('Syncing balances...', { connectionId });
      const response = await apiClient.post<{ success: boolean; message?: string; snapshots_created?: number }>(
        `bank_connections/${connectionId}/sync_balances`,
        {}
      );
      logger.info('Balance sync completed', { success: response.success, snapshots: response.snapshots_created });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
      queryClient.invalidateQueries({ queryKey: ['account-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['snapshots'] });
    },
  });
}

// Bank Account Mapping
export function useBankAccountMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bankAccountId,
      accountId,
    }: {
      bankAccountId: number;
      accountId: number | null;
    }) => {
      logger.debug('Mapping bank account...', { bankAccountId, accountId });
      const response = await apiClient.post<{ data: BankAccount }>(
        `bank_accounts/${bankAccountId}/map`,
        { account_id: accountId }
      );
      logger.info('Bank account mapped', { bankAccountId, accountId });
      return response.data || response;
    },
    onSuccess: () => {
      // Invalidate bank connections to refresh the list
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
  });
}
