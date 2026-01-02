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

// ... existing hooks ...

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
  });
}

export function useSyncBalances() {
  return useMutation({
    mutationFn: async (connectionId: number) => {
      logger.debug('Syncing balances...', { connectionId });
      const response = await apiClient.post<{ success: boolean; message?: string }>(
        `bank_connections/${connectionId}/sync_balances`,
        {}
      );
      logger.info('Balance sync completed', { success: response.success });
      return response;
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

// ... rest of existing hooks ...
