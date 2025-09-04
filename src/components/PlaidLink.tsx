'use client';

import { useEffect, useState } from 'react';
import { plaidApi, ApiError } from '@/lib/api';

interface PlaidLinkProps {
  userId: string;
  onSuccess: (publicToken: string, metadata: any) => void;
  onExit: (err: any, metadata: any) => void;
  onEvent: (eventName: string, metadata: any) => void;
}

declare global {
  interface Window {
    Plaid: {
      create: (config: any) => any;
    };
  }
}

export default function PlaidLink({ userId, onSuccess, onExit, onEvent }: PlaidLinkProps) {
  const [linkHandler, setLinkHandler] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Plaid script
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    script.onload = initializePlaidLink;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initializePlaidLink = async () => {
    if (!window.Plaid) {
      setError('Plaid script failed to load');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create link token
      const { link_token } = await plaidApi.createLinkToken(userId);

      // Initialize Plaid Link
      const handler = window.Plaid.create({
        token: link_token,
        onSuccess,
        onExit,
        onEvent,
      });

      setLinkHandler(handler);
    } catch (err) {
      const error = err as ApiError;
      setError(error.message || 'Failed to initialize Plaid Link');
    } finally {
      setIsLoading(false);
    }
  };

  const openPlaidLink = () => {
    if (linkHandler) {
      linkHandler.open();
    } else {
      setError('Plaid Link not initialized');
    }
  };

  return (
    <div>
      <button
        onClick={openPlaidLink}
        disabled={isLoading || !linkHandler}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Initializing...
          </>
        ) : (
          'Connect Bank Account'
        )}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
