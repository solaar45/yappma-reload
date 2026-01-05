// Transaction Types for Banking Integration

export type TransactionCategory = {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  type: 'income' | 'expense';
};

export type Transaction = {
  id: number;
  account_id: number;
  account_name: string;
  external_id: string;
  booking_date: string;
  value_date?: string;
  amount: string;
  currency: string;
  status: 'booked' | 'pending';
  description: string;
  creditor_name?: string;
  creditor_iban?: string;
  debtor_name?: string;
  debtor_iban?: string;
  notes?: string;
  category?: TransactionCategory;
  inserted_at: string;
  updated_at: string;
};

export type TransactionFilters = {
  from_date?: string;
  to_date?: string;
  status?: 'booked' | 'pending';
  category_id?: number;
  search?: string;
};

// Explicit exports for better module resolution
export type { Transaction, TransactionCategory, TransactionFilters };
