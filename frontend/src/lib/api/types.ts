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
  isin?: string | null;
  ticker?: string | null;
  currency: string;
  is_active: boolean;
  created_at_date: string | null;
  closed_at: string | null;
  risk_class?: number | null;
  risk_class_source?: 'auto_api' | 'auto_type' | 'manual' | null;
  savings_plan_amount?: string | null;
  user_id: number;
  institution_id: number | null;
  asset_type_id: number;
  asset_type?: AssetType;
  institution?: Institution;
  security_asset?: SecurityAsset | null;
  insurance_asset?: InsuranceAsset | null;
  real_estate_asset?: RealEstateAsset | null;
  snapshots?: AssetSnapshot[];
  inserted_at: string;
  updated_at: string;
}

export interface NetWorthResponse {
  total: string;
  assets: string;
  date: string;
}

export interface DashboardAssetSnapshot extends AssetSnapshot {
  asset?: {
    name: string;
    currency?: string;
    asset_type?: {
      description: string;
    };
    institution?: {
      name: string;
    };
  };
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
export type SnapshotCollection = DashboardAssetSnapshotsResponse;
