import { apiClient } from './client';
import type {
  Bank,
  BankConsent,
  BankAccount,
  ConsentStatus,
  SyncResult,
} from './types';

/**
 * API client for bank connections (PSD2 integration)
 */
export const bankConnectionsApi = {
  /**
   * List all available banks (ASPSPs)
   */
  listBanks: async (): Promise<Bank[]> => {
    const response = await apiClient.get<Bank[]>('/bank-connections/banks');
    return response.data;
  },

  /**
   * Get details for a specific bank
   */
  getBank: async (aspspId: string): Promise<Bank> => {
    const response = await apiClient.get<Bank>(`/bank-connections/banks/${aspspId}`);
    return response.data;
  },

  /**
   * List all consents for the current user
   */
  listConsents: async (): Promise<BankConsent[]> => {
    const response = await apiClient.get<BankConsent[]>('/bank-connections/consents');
    return response.data;
  },

  /**
   * Create a new consent with a bank
   */
  createConsent: async (params: {
    aspspId: string;
    redirectUrl: string;
  }): Promise<{
    consent_id: string;
    authorization_url: string;
    status: string;
  }> => {
    const response = await apiClient.post('/bank-connections/consents', {
      aspsp_id: params.aspspId,
      redirect_url: params.redirectUrl,
    });
    return response.data;
  },

  /**
   * Get consent status
   */
  getConsentStatus: async (consentId: string): Promise<ConsentStatus> => {
    const response = await apiClient.get<ConsentStatus>(
      `/bank-connections/consents/${consentId}`
    );
    return response.data;
  },

  /**
   * Complete consent after user authorization
   */
  completeConsent: async (params: {
    consentId: string;
    authorizationCode?: string;
  }): Promise<{ status: string }> => {
    const response = await apiClient.post(
      `/bank-connections/consents/${params.consentId}/complete`,
      {
        authorization_code: params.authorizationCode,
      }
    );
    return response.data;
  },

  /**
   * Revoke a consent
   */
  revokeConsent: async (consentId: string): Promise<void> => {
    await apiClient.delete(`/bank-connections/consents/${consentId}`);
  },

  /**
   * List accounts for a consent
   */
  listAccounts: async (consentId: string): Promise<BankAccount[]> => {
    const response = await apiClient.get<BankAccount[]>(
      `/bank-connections/consents/${consentId}/accounts`
    );
    return response.data;
  },

  /**
   * Sync accounts and transactions for a consent
   */
  syncAccounts: async (consentId: string): Promise<SyncResult> => {
    const response = await apiClient.post<SyncResult>(
      `/bank-connections/consents/${consentId}/sync`
    );
    return response.data;
  },
};
