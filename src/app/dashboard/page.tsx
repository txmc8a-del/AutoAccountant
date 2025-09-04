'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { plaidApi, sheetsApi, ApiError } from '@/lib/api';
import { PlaidItem, Transaction } from '@/types';

export default function DashboardPage() {
  const [userId, setUserId] = useState('user123');
  const [connectedAccounts, setConnectedAccounts] = useState<PlaidItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalTransactions: 0,
    totalSpent: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadDashboard();
    }
  }, [userId]);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Load accounts and transactions in parallel
      const [accountsResponse, transactionsResponse, statsResponse] = await Promise.allSettled([
        plaidApi.getAccounts(userId),
        sheetsApi.getTransactions({ limit: 20 }),
        sheetsApi.getStatistics(),
      ]);

      // Handle accounts
      if (accountsResponse.status === 'fulfilled') {
        setConnectedAccounts(accountsResponse.value.items);
        setStats(prev => ({ ...prev, totalAccounts: accountsResponse.value.items.length }));
      }

      // Handle transactions
      if (transactionsResponse.status === 'fulfilled') {
        setTransactions(transactionsResponse.value.transactions);
        setStats(prev => ({ ...prev, totalTransactions: transactionsResponse.value.transactions.length }));
      }

      // Handle statistics
      if (statsResponse.status === 'fulfilled') {
        const totalSpent = transactionsResponse.status === 'fulfilled' 
          ? transactionsResponse.value.transactions
              .filter((t: Transaction) => t.amount < 0)
              .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0)
          : 0;
        
        setStats(prev => ({ ...prev, totalSpent }));
      }

    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Financial Dashboard
          </h1>
          <p className="text-gray-600">
            Overview of your connected accounts and recent transactions.
          </p>
        </div>

        {/* User ID Input */}
        <div className="card mb-8">
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
            User ID
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-field max-w-xs"
            placeholder="Enter your user ID"
          />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <div className="text-3xl font-bold mb-1">{stats.totalAccounts}</div>
            <div className="text-primary-100">Connected Accounts</div>
          </div>
          <div className="card bg-gradient-to-r from-green-600 to-green-700 text-white">
            <div className="text-3xl font-bold mb-1">{stats.totalTransactions}</div>
            <div className="text-green-100">Total Transactions</div>
          </div>
          <div className="card bg-gradient-to-r from-red-600 to-red-700 text-white">
            <div className="text-3xl font-bold mb-1">{formatCurrency(stats.totalSpent)}</div>
            <div className="text-red-100">Total Spent</div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Connected Accounts */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Connected Accounts
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : connectedAccounts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No accounts connected yet.
              </p>
            ) : (
              <div className="space-y-3">
                {connectedAccounts.map((account) => (
                  <div key={account.item_id} className="p-3 border border-gray-200 rounded-lg">
                    <h3 className="font-medium text-gray-900">
                      {account.institution_name || 'Unknown Institution'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Status: {account.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      Connected: {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2 card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Transactions
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-gray-600">Loading...</span>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No transactions to display.
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.transaction_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {transaction.merchant_name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                      {transaction.user_category && (
                        <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full mt-1">
                          {transaction.user_category}
                        </span>
                      )}
                    </div>
                    <div className={`font-semibold text-lg ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
