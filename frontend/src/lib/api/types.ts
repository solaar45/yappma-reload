// ... existing types ...

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
