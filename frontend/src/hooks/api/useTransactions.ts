import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Transaction, TransactionFilters, TransactionCategory } from '@/types/transaction';
import logger from '@/lib/logger';

// Fetch all transactions for user
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      logger.debug('Fetching transactions', { filters });
      const params = new URLSearchParams();
      if (filters?.from_date) params.append('from_date', filters.from_date);
      if (filters?.to_date) params.append('to_date', filters.to_date);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category_id) params.append('category_id', filters.category_id.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await api.get<{ transactions: Transaction[] }>(
        `/transactions?${params.toString()}`
      );
      logger.debug('Transactions fetched', { count: response.transactions.length });
      return response.transactions;
    },
  });
}

// Fetch single transaction
export function useTransaction(id: number) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: async () => {
      const response = await api.get<{ transaction: Transaction }>(`/transactions/${id}`);
      return response.transaction;
    },
    enabled: !!id,
  });
}

// Fetch transaction categories
export function useTransactionCategories() {
  return useQuery({
    queryKey: ['transaction-categories'],
    queryFn: async () => {
      logger.debug('Fetching transaction categories');
      const response = await api.get<{ categories: TransactionCategory[] }>(
        '/transactions/categories'
      );
      logger.debug('Categories fetched', { count: response.categories.length });
      return response.categories;
    },
  });
}

// Update transaction (category, notes)
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: { category_id?: number; notes?: string };
    }) => {
      logger.debug('Updating transaction', { id, updates });
      const response = await api.put<{ transaction: Transaction }>(
        `/transactions/${id}`,
        updates
      );
      return response.transaction;
    },
    onSuccess: (transaction) => {
      logger.info('Transaction updated', { id: transaction.id });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', transaction.id] });
    },
    onError: (error) => {
      logger.error('Failed to update transaction', { error });
    },
  });
}

// Export transactions to CSV
export function exportTransactionsToCSV(transactions: Transaction[], filename = 'transactions.csv') {
  const headers = [
    'Date',
    'Description',
    'Amount',
    'Currency',
    'Category',
    'Account',
    'Status',
    'Creditor',
    'Debtor',
    'Notes',
  ];

  const rows = transactions.map((t) => [
    t.booking_date,
    t.description,
    t.amount,
    t.currency,
    t.category?.name || '',
    t.account_name,
    t.status,
    t.creditor_name || '',
    t.debtor_name || '',
    t.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  logger.info('Transactions exported to CSV', { count: transactions.length, filename });
}
