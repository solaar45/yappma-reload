// User types
export interface User {
  id: number;
  email: string;
  name?: string;
  currency_default: string;
  tax_status: 'single' | 'married';
  tax_allowance_limit: number;
}

// Institution types
export interface Institution {
  id: number;
  name: string;
  type?: 'bank' | 'broker' | 'insurance' | 'crypto' | 'other';
  category: 'bank' | 'neobank' | 'broker' | 'crypto' | 'insurance' | 'other';
  country?: string;
  website?: string;
  logo_url?: string;
  bic?: string;
  is_system_provided: boolean;
}

// Account types
export type AccountType = 
  | 'checking' 
  | 'savings' 
  | 'savings_account'
  | 'fixed_deposit'
  | 'brokerage' 
  | 'wallet'
  | 'credit_card'
  | 'loan'
  | 'insurance' 
  | 'cash' 
  | 'other';

export interface AccountSnapshot {
  id: number;
  snapshot_date: string;
  balance: string;
  currency: string;
  note?: string;
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  currency: string;
  is_active: boolean;
  opened_at?: string;
  closed_at?: string;
  institution_id?: number;
  institution?: Institution;
  snapshots?: AccountSnapshot[];
}

export interface CreateAccountParams {
  name: string;
  type: AccountType;
  currency: string;
  institution_id?: number;
  custom_institution_name?: string;
  user_id: number;
  is_active?: boolean;
}

export interface UpdateAccountParams {
  name?: string;
  type?: AccountType;
  currency?: string;
  institution_id?: number;
  is_active?: boolean;
}

// Asset types
export type AssetTypeCode = 'security' | 'crypto' | 'real_estate' | 'vehicle' | 'collectible' | 'cash' | 'insurance' | 'loan' | 'other';

export interface AssetType {
  id: number;
  code: AssetTypeCode;
  description: string;
}

export interface SecurityAsset {
  isin?: string;
  wkn?: string;
  ticker?: string;
  exchange?: string;
  sector?: string;
  risk_class?: number;
}

export interface InsuranceAsset {
  insurer_name?: string;
  policy_number?: string;
  insurance_type?: 'life' | 'pension' | 'liability' | 'health' | 'other';
  start_date?: string;
  end_date?: string;
  premium_amount?: string;
  premium_frequency?: 'monthly' | 'quarterly' | 'yearly' | 'one_time';
  coverage_amount?: string;
}

export interface RealEstateAsset {
  address?: string;
  type?: 'apartment' | 'house' | 'land' | 'commercial' | 'garage' | 'other';
  size_m2?: string;
  construction_year?: number;
  purchase_date?: string;
  purchase_price?: string;
}

export interface LoanAsset {
  lender_name?: string;
  loan_type?: 'mortgage' | 'personal' | 'vehicle' | 'student' | 'other';
  start_date?: string;
  end_date?: string;
  interest_rate?: string;
  initial_amount?: string;
}

export interface Asset {
  id: number;
  name: string;
  symbol?: string; // For compatibility
  description?: string;
  currency: string;
  is_active: boolean;
  account_id?: number;
  asset_type_id: number;
  asset_type?: AssetType;
  
  // Specific asset details (one of these will be populated based on type)
  security_asset?: SecurityAsset;
  insurance_asset?: InsuranceAsset;
  real_estate_asset?: RealEstateAsset;
  loan_asset?: LoanAsset;
  
  snapshots?: AssetSnapshot[];
}

export interface AssetSnapshot {
  id: number;
  snapshot_date: string;
  quantity: string;
  market_price_per_unit: string;
  value: string;
  cost_basis?: string;
  exchange_rate?: string;
}

export interface CreateAssetParams {
  name: string;
  currency: string;
  account_id?: number;
  asset_type_id: number;
  is_active?: boolean;
  created_at_date?: string; // Optional: date when asset was added/bought
  
  // Specific fields based on type
  security_asset?: SecurityAsset;
  insurance_asset?: InsuranceAsset;
  real_estate_asset?: RealEstateAsset;
  loan_asset?: LoanAsset;
}

// Analytics types
export interface WealthHistoryPoint {
  date: string;
  total_wealth: number;
  by_type: Record<string, number>;
}
