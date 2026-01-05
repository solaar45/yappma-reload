// Bank Connection Types (PSD2)

export interface Bank {
  aspsp_id: string;
  name: string;
  bic?: string;
  logo_url?: string;
  country_code: string;
}

export interface BankConsent {
  id: string;
  aspsp_id: string;
  bank_name?: string;
  status: 'created' | 'authorized' | 'active' | 'expired' | 'revoked' | 'failed';
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsentStatus {
  consent_id: string;
  status: 'created' | 'authorized' | 'active' | 'expired' | 'revoked' | 'failed';
  valid_until?: string;
}

export interface BankAccount {
  id: string;
  consent_id: string;
  external_id: string;
  iban?: string;
  name: string;
  currency: string;
  balance?: string;
  account_type?: string;
  inserted_at: string;
  updated_at: string;
}

export interface SyncResult {
  accounts_synced: number;
  transactions_synced: number;
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
}

// Transaction Types

export interface Transaction {
  id: number;
  account_id: number;
  external_id: string;
  booking_date: string;
  value_date?: string;
  amount: string;
  currency: string;
  status: 'booked' | 'pending';
  description?: string;
  additional_info?: string;
  creditor_name?: string;
  creditor_iban?: string;
  debtor_name?: string;
  debtor_iban?: string;
  inserted_at: string;
  updated_at: string;
}

export interface TransactionListParams {
  from_date?: string;
  to_date?: string;
  status?: 'booked' | 'pending';
  limit?: number;
}

export interface TransactionSyncParams {
  account_id: number;
  consent_id: string;
  from_date?: string;
  to_date?: string;
}

// Institution Types

export interface Institution {
  id: number;
  user_id: number;
  name: string;
  type: 'bank' | 'broker' | 'insurance' | 'other';
  country: string;
  notes?: string;
  inserted_at: string;
  updated_at: string;
}

// Asset Types

export interface Asset {
  id: number;
  user_id: number;
  account_id?: number;
  institution_id?: number;
  name: string;
  type: 'stock' | 'bond' | 'fund' | 'etf' | 'crypto' | 'real_estate' | 'cash' | 'other';
  symbol?: string;
  quantity: string;
  currency: string;
  notes?: string;
  inserted_at: string;
  updated_at: string;
}
