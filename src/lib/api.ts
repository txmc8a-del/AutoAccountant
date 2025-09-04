const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, errorData.error || response.statusText);
  }

  return response.json();
}

// Plaid API functions
export const plaidApi = {
  createLinkToken: async (userId: string, clientName: string = 'AutoAccountant') => {
    return apiRequest<{ link_token: string }>('/plaid/create-link-token', {
      method: 'POST',
      body: JSON.stringify({ userId, clientName }),
    });
  },

  exchangeToken: async (publicToken: string, userId: string) => {
    return apiRequest<{
      access_token: string;
      item_id: string;
      institution: {
        institution_id: string;
        name: string;
        logo?: string;
      };
      message: string;
    }>('/plaid/exchange-token', {
      method: 'POST',
      body: JSON.stringify({ public_token: publicToken, user_id: userId }),
    });
  },

  getAccounts: async (userId: string) => {
    return apiRequest<{ items: any[] }>(`/plaid/accounts/${userId}`);
  },

  getItem: async (itemId: string) => {
    return apiRequest<{ item: any }>(`/plaid/item/${itemId}`);
  },

  deleteItem: async (itemId: string) => {
    return apiRequest<{ message: string }>(`/plaid/item/${itemId}`, {
      method: 'DELETE',
    });
  },
};

// Sheets API functions
export const sheetsApi = {
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    const endpoint = `/sheets/transactions${query ? `?${query}` : ''}`;
    
    return apiRequest<{
      transactions: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
      };
    }>(endpoint);
  },

  getStatistics: async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    const endpoint = `/sheets/statistics${query ? `?${query}` : ''}`;
    
    return apiRequest<{
      total_transactions: number;
      total_amount: number;
      average_amount: number;
      category_breakdown: Record<string, number>;
      monthly_breakdown: Record<string, number>;
      top_merchants: Array<{ merchant: string; amount: number }>;
    }>(endpoint);
  },

  updateTransactionCategory: async (
    transactionId: string,
    userCategory: string,
    userNotes?: string
  ) => {
    return apiRequest<{
      message: string;
      transaction_id: string;
      user_category: string;
      user_notes: string;
    }>(`/sheets/transactions/${transactionId}/category`, {
      method: 'PUT',
      body: JSON.stringify({ user_category: userCategory, user_notes: userNotes }),
    });
  },
};
