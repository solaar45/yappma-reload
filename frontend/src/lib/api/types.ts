// API Response Types based on backend REST_API.md

export interface User {
  id: number;
  name: string;
  email: string;
  currency_default: string;
  inserted_at: string;
  updated_at: string;
}

export interface Institution {
  id: number;
  name: string;
  type: 'bank' | 'broker' | 'insurance' | 'other';
  country: string;
  user_id: number;
  inserted_at: string;
  updated_at: string;
}

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
  inserted_at: string;
  updated_at: string;
}

export interface AssetType {
  id: number;
  code: 'cash' | 'security' | 'insurance' | 'loan' | 'real_estate' | 'other';
  description: string;
}

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
  name: string;
  symbol: string | null;
  currency: string;
  is_active: boolean;
  created_at_date: string | null;
  closed_at: string | null;
  user_id: number;
  account_id: number | null;
  asset_type_id: number;
  asset_type?: AssetType;
  account?: Account;
  security_asset?: SecurityAsset | null;
  insurance_asset?: InsuranceAsset | null;
  real_estate_asset?: RealEstateAsset | null;
  inserted_at: string;
  updated_at: string;
}

export interface AccountSnapshot {
  id: number;
  snapshot_date: string;
  balance: string;
  currency: string;
  note: string | null;
  account_id: number;
  account?: Account;
  inserted_at: string;
  updated_at: string;
}

export interface AssetSnapshot {
  id: number;
  snapshot_date: string;
  quantity: string | null;
  market_price_per_unit: string | null;
  value: string;
  note: string | null;
  asset_id: number;
  asset?: Asset;
  inserted_at: string;
  updated_at: string;
}

export interface NetWorthResponse {
  total: string;
  accounts: string;
  assets: string;
  date: string;
}

export interface DashboardAccountSnapshotsResponse {
  snapshots: AccountSnapshot[];
  date: string;
}

export interface DashboardAssetSnapshotsResponse {
  snapshots: AssetSnapshot[];
  date: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  errors: Record<string, string[]> | { detail: string };
}