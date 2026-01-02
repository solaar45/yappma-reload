/**
 * API client for bank connections (PSD2/Styx integration)
 */

import { apiClient } from './client';

export interface Bank {
  aspsp_id: string;
  name: string;
  bic: string;
  logo_url?: string;
  supported_services: string[];
  supported_sca_methods: string[];
}

export interface BankConsent {
  id: string;
  user_id: string;
  aspsp_id: string;
  aspsp_name: string;
  consent_id: string;
  status: 'pending' | 'valid' | 'expired' | 'revoked' | 'rejected';
  valid_until: string;
  last_used_at?: string;
  authorization_url?: string;
}

export interface ConsentInitResponse {
  consent_id: string;
  authorization_url: string;
  status: string;
}

export interface BankAccount {
  iban: string;
  name: string;
  currency: string;
  balance?: {
    amount: number;
    currency: string;
  };
  resource_id: string;
}

export interface SyncResult {
  accounts_synced: number;
  transactions_imported: number;
}

/**
 * Lists all available banks (ASPSPs) configured in Styx
 */
export async function listBanks(): Promise<Bank[]> {
  const response = await apiClient.get('/api/bank_connections/banks');
  return response.data;
}

/**
 * Gets details for a specific bank
 */
export async function getBank(aspspId: string): Promise<Bank> {
  const response = await apiClient.get(`/api/bank_connections/banks/${aspspId}`);
  return response.data;
}

/**
 * Initiates consent flow for a bank
 * Returns authorization URL to redirect user to
 */
export async function initiateConsent(
  aspspId: string,
  redirectUrl: string
): Promise<ConsentInitResponse> {
  const response = await apiClient.post('/api/bank_connections/consents', {
    aspsp_id: aspspId,
    redirect_url: redirectUrl,
  });
  return response.data;
}

/**
 * Completes consent after user authorization
 * Called from redirect callback
 */
export async function completeConsent(
  consentId: string,
  authCode?: string
): Promise<BankConsent> {
  const response = await apiClient.post(
    `/api/bank_connections/consents/${consentId}/complete`,
    { authorization_code: authCode }
  );
  return response.data;
}

/**
 * Lists all bank consents for current user
 */
export async function listConsents(): Promise<BankConsent[]> {
  const response = await apiClient.get('/api/bank_connections/consents');
  return response.data;
}

/**
 * Gets consent status
 */
export async function getConsentStatus(consentId: string): Promise<BankConsent> {
  const response = await apiClient.get(
    `/api/bank_connections/consents/${consentId}`
  );
  return response.data;
}

/**
 * Revokes a consent
 */
export async function revokeConsent(consentId: string): Promise<void> {
  await apiClient.delete(`/api/bank_connections/consents/${consentId}`);
}

/**
 * Lists accounts accessible via a consent
 */
export async function listAccounts(consentId: string): Promise<BankAccount[]> {
  const response = await apiClient.get(
    `/api/bank_connections/consents/${consentId}/accounts`
  );
  return response.data;
}

/**
 * Syncs accounts and transactions for a consent
 */
export async function syncAccounts(consentId: string): Promise<SyncResult> {
  const response = await apiClient.post(
    `/api/bank_connections/consents/${consentId}/sync`
  );
  return response.data;
}
