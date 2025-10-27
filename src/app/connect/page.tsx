'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import PlaidLink from '@/components/PlaidLink';
import { plaidApi, ApiError } from '@/lib/api';
import { PlaidItem } from '@/types';

export default function ConnectPage() {
  const [userId, setUserId] = useState('user123');
  const [connectedAccounts, setConnectedAccounts] = useState<PlaidItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (userId) {
      loadConnectedAccounts();
    }
  }, [userId]);

  const loadConnectedAccounts = async () => {
    try {
      setIsLoading(true);
      const { items } = await plaidApi.getItems(userId);
      setConnectedAccounts(items);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      // Don't show error if no accounts are connected yet
      if (error instanceof ApiError && error.status !== 404) {
        setStatus({ type: 'error', message: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    try {
      setStatus({ type: 'info', message: 'Connecting account...' });
      
      const result = await plaidApi.exchangeToken(publicToken, userId);
      
      setStatus({ 
        type: 'success', 
        message: `Successfully connected ${result.institution.name}!` 
      });
      
      // Reload connected accounts
      await loadConnectedAccounts();
      
    } catch (error) {
      const apiError = error as ApiError;
      setStatus({ 
        type: 'error', 
        message: `Failed to connect account: ${apiError.message}` 
      });
    }
  };

  const handlePlaidExit = (err: any, metadata: any) => {
    if (err) {
      setStatus({ 
        type: 'error', 
        message: `Connection failed: ${err.error_message}` 
      });
    } else {
      setStatus({ 
        type: 'info', 
        message: 'Connection cancelled' 
      });
    }
  };

  const handlePlaidEvent = (eventName: string, metadata: any) => {
    console.log('Plaid event:', eventName, metadata);
  };

  const deleteAccount = async (itemId: string) => {
    try {
      await plaidApi.deleteItem(itemId);
      setStatus({ type: 'success', message: 'Account disconnected successfully' });
      await loadConnectedAccounts();
    } catch (error) {
      const apiError = error as ApiError;
      setStatus({ type: 'error', message: `Failed to disconnect account: ${apiError.message}` });
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Connect Your Financial Accounts
          </h1>
          <p className="text-gray-600">
            Securely connect your bank accounts, credit cards, and investment accounts to start tracking your finances.
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
            className="input-field"
            placeholder="Enter your user ID"
          />
        </div>

        {/* Plaid Link Button */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Connect New Account
          </h2>
          <PlaidLink
            userId={userId}
            onSuccess={handlePlaidSuccess}
            onExit={handlePlaidExit}
            onEvent={handlePlaidEvent}
          />
        </div>

        {/* Status Messages */}
        {status && (
          <div className={`mb-8 p-4 rounded-lg border ${
            status.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : status.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {status.message}
          </div>
        )}

        {/* Connected Accounts */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Connected Accounts
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Loading accounts...</span>
            </div>
          ) : connectedAccounts?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No accounts connected yet. Use the button above to connect your first account.
            </p>
          ) : (
            <div className="space-y-4">
              {connectedAccounts?.map((account) => (
                <div key={account.item_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {account.institution_name || 'Unknown Institution'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Item ID: {account.item_id} • Status: {account.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      Connected: {new Date(account.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteAccount(account.item_id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
