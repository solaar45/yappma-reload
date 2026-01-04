import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankConnectionsApi } from '../bankConnections';
import type { Bank, BankConsent, BankAccount, SyncResult } from '../types';
import { logger } from '../../logger';

/**
 * Query keys for bank connections
 */
export const bankConnectionKeys = {
  all: ['bankConnections'] as const,
  banks: () => [...bankConnectionKeys.all, 'banks'] as const,
  bank: (id: string) => [...bankConnectionKeys.all, 'bank', id] as const,
  consents: () => [...bankConnectionKeys.all, 'consents'] as const,
  consent: (id: string) => [...bankConnectionKeys.all, 'consent', id] as const,
  accounts: (consentId: string) => [...bankConnectionKeys.all, 'accounts', consentId] as const,
};

/**
 * Hook to fetch available banks
 */
export function useBanks() {
  return useQuery({
    queryKey: bankConnectionKeys.banks(),
    queryFn: async () => {
      logger.debug('Fetching banks');
      return bankConnectionsApi.listBanks();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a specific bank
 */
export function useBank(aspspId: string) {
  return useQuery({
    queryKey: bankConnectionKeys.bank(aspspId),
    queryFn: async () => {
      logger.debug(`Fetching bank ${aspspId}`);
      return bankConnectionsApi.getBank(aspspId);
    },
    enabled: !!aspspId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch user's consents
 */
export function useConsents() {
  return useQuery({
    queryKey: bankConnectionKeys.consents(),
    queryFn: async () => {
      logger.debug('Fetching consents');
      return bankConnectionsApi.listConsents();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch consent status
 */
export function useConsentStatus(consentId: string) {
  return useQuery({
    queryKey: bankConnectionKeys.consent(consentId),
    queryFn: async () => {
      logger.debug(`Fetching consent status ${consentId}`);
      return bankConnectionsApi.getConsentStatus(consentId);
    },
    enabled: !!consentId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10s when pending
  });
}

/**
 * Hook to fetch accounts for a consent
 */
export function useConsentAccounts(consentId: string) {
  return useQuery({
    queryKey: bankConnectionKeys.accounts(consentId),
    queryFn: async () => {
      logger.debug(`Fetching accounts for consent ${consentId}`);
      return bankConnectionsApi.listAccounts(consentId);
    },
    enabled: !!consentId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to create a new consent
 */
export function useCreateConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { aspspId: string; redirectUrl: string }) => {
      logger.info(`Creating consent for bank ${params.aspspId}`);
      return bankConnectionsApi.createConsent(params);
    },
    onSuccess: () => {
      // Invalidate consents list
      queryClient.invalidateQueries({ queryKey: bankConnectionKeys.consents() });
    },
    onError: (error) => {
      logger.error('Failed to create consent', error);
    },
  });
}

/**
 * Hook to revoke a consent
 */
export function useRevokeConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (consentId: string) => {
      logger.info(`Revoking consent ${consentId}`);
      return bankConnectionsApi.revokeConsent(consentId);
    },
    onSuccess: () => {
      // Invalidate consents list
      queryClient.invalidateQueries({ queryKey: bankConnectionKeys.consents() });
    },
    onError: (error) => {
      logger.error('Failed to revoke consent', error);
    },
  });
}

/**
 * Hook to sync accounts for a consent
 */
export function useSyncAccounts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (consentId: string) => {
      logger.info(`Syncing accounts for consent ${consentId}`);
      return bankConnectionsApi.syncAccounts(consentId);
    },
    onSuccess: (data, consentId) => {
      logger.info(`Successfully synced ${data.accounts_synced} accounts`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: bankConnectionKeys.accounts(consentId) });
      queryClient.invalidateQueries({ queryKey: ['accounts'] }); // Main accounts list
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }); // Dashboard data
    },
    onError: (error) => {
      logger.error('Failed to sync accounts', error);
    },
  });
}
