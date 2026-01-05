import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Transaction, TransactionListParams, TransactionSyncParams } from '@/lib/api/types';
import { logger } from '@/lib/logger';

interface UseTransactionsParams extends TransactionListParams {
  userId: number;
}

export function useTransactions({ userId, ...params }: UseTransactionsParams) {
  return useQuery({
    queryKey: ['transactions', userId, params],
    queryFn: async () => {
      logger.debug('Fetching transactions...', { userId, params });
      
      const queryParams = new URLSearchParams();
      if (params.from_date) queryParams.append('from_date', params.from_date);
      if (params.to_date) queryParams.append('to_date', params.to_date);
      if (params.status) queryParams.append('status', params.status);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `transactions?${queryParams.toString()}`;
      const response = await apiClient.get<{ data: Transaction[] }>(url);
      
      const transactions = Array.isArray(response) ? response : response.data || [];
      logger.info('Transactions loaded', { count: transactions.length });
      
      return transactions;
    },
    enabled: !!userId,
  });
}

export function useAccountTransactions(accountId: number, params: TransactionListParams = {}) {
  return useQuery({
    queryKey: ['transactions', 'account', accountId, params],
    queryFn: async () => {
      logger.debug('Fetching account transactions...', { accountId, params });
      
      const queryParams = new URLSearchParams();
      if (params.from_date) queryParams.append('from_date', params.from_date);
      if (params.to_date) queryParams.append('to_date', params.to_date);
      if (params.status) queryParams.append('status', params.status);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `accounts/${accountId}/transactions?${queryParams.toString()}`;
      const response = await apiClient.get<{ data: Transaction[] }>(url);
      
      const transactions = Array.isArray(response) ? response : response.data || [];
      logger.info('Account transactions loaded', { count: transactions.length, accountId });
      
      return transactions;
    },
    enabled: !!accountId,
  });
}

export function useSyncTransactions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ account_id, consent_id, from_date, to_date }: TransactionSyncParams) => {
      logger.info('Syncing transactions...', { account_id, consent_id });
      
      const params: Record<string, string> = {
        account_id: account_id.toString(),
        consent_id,
      };
      
      if (from_date) params.from_date = from_date;
      if (to_date) params.to_date = to_date;
      
      const response = await apiClient.post<{
        success: boolean;
        transactions_synced: number;
        error?: string;
      }>('transactions/sync', params);
      
      logger.info('Transaction sync completed', response);
      return response;
    },
    onSuccess: () => {
      // Invalidate all transaction queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
