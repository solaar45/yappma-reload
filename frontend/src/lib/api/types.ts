// API Response Types based on backend REST_API.md

export interface User {
  id: number;
  name: string;
  email: string;
  currency_default: string;
  tax_allowance_limit: number;
  tax_status: 'single' | 'married';
  inserted_at: string;
  updated_at: string;
}

export interface TaxExemption {
  id: number;
  amount: string;
  year: number;
  user_id: number;
  institution_id: number;
  institution?: Institution;
  inserted_at: string;
  updated_at: string;
}

export interface Institution {
  id: number;
  name: string;
  type: 'bank' | 'broker' | 'insurance' | 'other';
  category?: 'bank' | 'neobank' | 'broker' | 'insurance' | 'crypto' | 'other';
  country: string;
  is_system_provided: boolean;
  user_id: number | null;
  bic?: string;
  logo_url?: string;
  website?: string;
  assets?: Asset[];
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

export interface AssetType {
  id: number;
  code: 'cash' | 'security' | 'insurance' | 'loan' | 'real_estate' | 'crypto' | 'commodity' | 'collectible' | 'other';
  description: string;
}

export interface SecurityAsset {
  isin: string | null;
  wkn: string | null;
  ticker: string | null;
  exchange: string | null;
  sector: string | null;
  // Extended fields
  security_type: 'stock' | 'etf' | 'bond' | 'mutual_fund' | 'index_fund' | null;
  distribution_type: 'accumulating' | 'distributing' | null;
  expense_ratio: string | null;
  issuer: string | null;
  coupon_rate: string | null;
  maturity_date: string | null;
  country_of_domicile: string | null;
  benchmark_index: string | null;
}

export interface InsuranceAsset {
  insurer_name: string;
  policy_number: string;
  insurance_type: string;
  coverage_amount: string;
  deductible: string;
  payment_frequency: string;
  // Extended fields
  policy_start_date: string | null;
  policy_end_date: string | null;
  premium_amount: string | null;
}

export interface RealEstateAsset {
  address: string;
  size_m2: string;
  purchase_price: string;
  purchase_date: string;
  // Extended fields
  property_type: 'residential' | 'commercial' | 'land' | 'mixed_use' | null;
  usage: 'owner_occupied' | 'rented_out' | 'vacant' | 'development' | null;
  rental_income: string | null;
  operating_expenses: string | null;
  property_tax: string | null;
  mortgage_outstanding: string | null;
  mortgage_rate: string | null;
  construction_year: number | null;
  renovation_year: number | null;
  cadastral_number: string | null;
}

export interface Asset {
  id: number;
  name: string;
  symbol: string | null;
  isin?: string | null;
  ticker?: string | null;
  currency: string;
  is_active: boolean;
  created_at_date: string | null;
  closed_at: string | null;
  risk_class?: number | null;
  risk_class_source?: 'auto_api' | 'auto_type' | 'manual' | null;
  user_id: number;
  account_id: number | null;
  asset_type_id: number;
  asset_type?: AssetType;
  account?: Account;
  security_asset?: SecurityAsset | null;
  insurance_asset?: InsuranceAsset | null;
  real_estate_asset?: RealEstateAsset | null;
  snapshots?: AssetSnapshot[];
  inserted_at: string;
  updated_at: string;
}

// Security enrichment types
export interface SecurityEnrichmentRequest {
  identifier: string;
  type?: 'ticker' | 'isin' | 'wkn' | 'auto';
}

export interface SecurityEnrichmentResponse {
  ticker?: string;
  name?: string;
  security_type?: 'stock' | 'etf' | 'bond' | 'mutual_fund' | 'index_fund';
  exchange?: string;
  currency?: string;
  sector?: string;
  country_of_domicile?: string;
  expense_ratio?: number;
  distribution_type?: 'accumulating' | 'distributing';
  benchmark_index?: string;
}

export interface NetWorthResponse {
  total: string;
  accounts: string;
  assets: string;
  date: string;
}

// Dashboard-specific snapshot types with nested relations
export interface DashboardAccountSnapshot extends AccountSnapshot {
  account?: {
    name: string;
    institution?: {
      name: string;
    };
  };
}

export interface DashboardAssetSnapshot extends AssetSnapshot {
  asset?: {
    name: string;
    currency?: string;
    asset_type?: {
      description: string;
    };
  };
}

export interface DashboardAccountSnapshotsResponse {
  snapshots: DashboardAccountSnapshot[];
  date: string;
}

export interface DashboardAssetSnapshotsResponse {
  snapshots: DashboardAssetSnapshot[];
  date: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  errors: Record<string, string[]> | { detail: string };
}

export type NetWorth = NetWorthResponse;
export type SnapshotCollection = DashboardAccountSnapshotsResponse | DashboardAssetSnapshotsResponse;
