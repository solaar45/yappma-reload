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

// Snapshot Types

export interface AccountSnapshot {
  id: number;
  snapshot_date: string;
  balance: string;
  currency: string;
  note: string | null;
  account_id: number;
  inserted_at?: string;
  updated_at?: string;
}

export interface AssetSnapshot {
  id: number;
  snapshot_date: string;
  quantity: string | null;
  market_price_per_unit: string | null;
  value: string;
  note: string | null;
  asset_id: number;
  inserted_at?: string;
  updated_at?: string;
}

// Asset Type

export interface AssetType {
  id: number;
  code: 'cash' | 'security' | 'insurance' | 'loan' | 'real_estate' | 'other';
  description: string;
}

// Account Types

export interface Account {
  id: number;
  name: string;
  type: 'checking' | 'savings' | 'credit_card' | 'brokerage' | 'insurance' | 'cash' | 'other';
  currency: string;
  is_active: boolean;
  opened_at: string | null;
  closed_at: string | null;
  user_id: number;
  institution_id: number;
  institution?: Institution;
  snapshots?: AccountSnapshot[];
  inserted_at: string;
  updated_at: string;
}

// Asset Types

export interface SecurityAsset {
  isin: string | null;
  wkn: string | null;
  ticker: string | null;
  exchange: string | null;
  sector: string | null;
}

export interface InsuranceAsset {
  insurer_name: string;
  policy_number: string;
  insurance_type: string;
  coverage_amount: string;
  payment_frequency: string;
}

export interface RealEstateAsset {
  address: string;
  size_m2: string;
  purchase_price: string;
  purchase_date: string;
}

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
  is_active?: boolean;
  created_at_date?: string | null;
  closed_at?: string | null;
  asset_type_id?: number;
  asset_type?: AssetType;
  account?: Account;
  security_asset?: SecurityAsset | null;
  insurance_asset?: InsuranceAsset | null;
  real_estate_asset?: RealEstateAsset | null;
  snapshots?: AssetSnapshot[];
  inserted_at: string;
  updated_at: string;
}
