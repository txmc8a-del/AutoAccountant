export interface PlaidItem {
  _id: string;
  access_token: string;
  item_id: string;
  user_id: string;
  institution_id?: string;
  institution_name?: string;
  accounts: PlaidAccount[];
  status: 'active' | 'pending' | 'error';
  created_at: string;
  updated_at: string;
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  type: string;
  subtype: string;
  mask?: string;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  account_name?: string;
  institution_name?: string;
  date: string;
  amount: number;
  currency: string;
  merchant_name?: string;
  category?: string;
  subcategory?: string;
  category_id?: string;
  user_category?: string;
  user_notes?: string;
  pending: boolean;
  payment_channel?: string;
  transaction_type?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaidLinkTokenResponse {
  link_token: string;
}

export interface PlaidExchangeResponse {
  access_token: string;
  item_id: string;
  institution: {
    institution_id: string;
    name: string;
    logo?: string;
  };
  message: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalAccounts: number;
  totalTransactions: number;
  totalSpent: number;
}
