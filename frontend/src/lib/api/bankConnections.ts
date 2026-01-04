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
  return await apiClient.get<Bank[]>('bank-connections/banks');
}

/**
 * Gets details for a specific bank
 */
export async function getBank(aspspId: string): Promise<Bank> {
  return await apiClient.get<Bank>(`bank-connections/banks/${aspspId}`);
}

/**
 * Initiates consent flow for a bank
 * Returns authorization URL to redirect user to
 */
export async function initiateConsent(
  aspspId: string,
  redirectUrl: string
): Promise<ConsentInitResponse> {
  return await apiClient.post<ConsentInitResponse>('bank-connections/consents', {
    aspsp_id: aspspId,
    redirect_url: redirectUrl,
  });
}

/**
 * Completes consent after user authorization
 * Called from redirect callback
 */
export async function completeConsent(
  consentId: string,
  authCode?: string
): Promise<BankConsent> {
  return await apiClient.post<BankConsent>(
    `bank-connections/consents/${consentId}/complete`,
    { authorization_code: authCode }
  );
}

/**
 * Lists all bank consents for current user
 */
export async function listConsents(): Promise<BankConsent[]> {
  return await apiClient.get<BankConsent[]>('bank-connections/consents');
}

/**
 * Gets consent status
 */
export async function getConsentStatus(consentId: string): Promise<BankConsent> {
  return await apiClient.get<BankConsent>(
    `bank-connections/consents/${consentId}`
  );
}

/**
 * Revokes a consent
 */
export async function revokeConsent(consentId: string): Promise<void> {
  await apiClient.delete(`bank-connections/consents/${consentId}`);
}

/**
 * Lists accounts accessible via a consent
 */
export async function listAccounts(consentId: string): Promise<BankAccount[]> {
  return await apiClient.get<BankAccount[]>(
    `bank-connections/consents/${consentId}/accounts`
  );
}

/**
 * Syncs accounts and transactions for a consent
 */
export async function syncAccounts(consentId: string): Promise<SyncResult> {
  return await apiClient.post<SyncResult>(
    `bank-connections/consents/${consentId}/sync`
  );
}
