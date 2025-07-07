import { jest } from '@jest/globals';
import plaidService from '../services/plaidService.js';

// Mock the Plaid client
jest.mock('plaid', () => ({
  Configuration: jest.fn(),
  PlaidApi: jest.fn(),
  PlaidEnvironments: {
    sandbox: 'https://sandbox.plaid.com'
  }
}));

describe('PlaidService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLinkToken', () => {
    it('should create a link token successfully', async () => {
      const mockLinkToken = 'link-sandbox-token';
      plaidService.client.linkTokenCreate = jest.fn().mockResolvedValue({
        data: { link_token: mockLinkToken }
      });

      const result = await plaidService.createLinkToken('user123', 'TestApp');
      
      expect(result).toBe(mockLinkToken);
      expect(plaidService.client.linkTokenCreate).toHaveBeenCalledWith({
        user: { client_user_id: 'user123' },
        client_name: 'TestApp',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en',
        webhook: process.env.PLAID_WEBHOOK_URL,
        account_filters: {
          depository: {
            account_subtypes: ['checking', 'savings']
          },
          credit: {
            account_subtypes: ['credit card']
          },
          investment: {
            account_subtypes: ['all']
          }
        }
      });
    });

    it('should throw error when link token creation fails', async () => {
      const error = new Error('API Error');
      plaidService.client.linkTokenCreate = jest.fn().mockRejectedValue(error);

      await expect(plaidService.createLinkToken('user123')).rejects.toThrow('Failed to create link token');
    });
  });

  describe('exchangePublicToken', () => {
    it('should exchange public token for access token successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'access-sandbox-token',
          item_id: 'item-sandbox-id'
        }
      };
      
      plaidService.client.itemPublicTokenExchange = jest.fn().mockResolvedValue(mockResponse);

      const result = await plaidService.exchangePublicToken('public-sandbox-token');
      
      expect(result).toEqual({
        accessToken: 'access-sandbox-token',
        itemId: 'item-sandbox-id'
      });
    });

    it('should throw error when token exchange fails', async () => {
      const error = new Error('Invalid token');
      plaidService.client.itemPublicTokenExchange = jest.fn().mockRejectedValue(error);

      await expect(plaidService.exchangePublicToken('invalid-token')).rejects.toThrow('Failed to exchange public token');
    });
  });

  describe('getAccounts', () => {
    it('should get accounts successfully', async () => {
      const mockAccounts = [
        { account_id: 'acc1', name: 'Checking Account' },
        { account_id: 'acc2', name: 'Savings Account' }
      ];
      
      plaidService.client.accountsGet = jest.fn().mockResolvedValue({
        data: { accounts: mockAccounts }
      });

      const result = await plaidService.getAccounts('access-token');
      
      expect(result).toEqual(mockAccounts);
      expect(plaidService.client.accountsGet).toHaveBeenCalledWith({
        access_token: 'access-token'
      });
    });
  });

  describe('getTransactions', () => {
    it('should get transactions successfully', async () => {
      const mockTransactions = [
        { transaction_id: 'txn1', amount: 100 },
        { transaction_id: 'txn2', amount: 200 }
      ];
      
      plaidService.client.transactionsGet = jest.fn().mockResolvedValue({
        data: { transactions: mockTransactions }
      });

      const result = await plaidService.getTransactions('access-token', '2024-01-01', '2024-01-31');
      
      expect(result).toEqual(mockTransactions);
      expect(plaidService.client.transactionsGet).toHaveBeenCalledWith({
        access_token: 'access-token',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        options: {
          include_personal_finance_category: true
        }
      });
    });
  });
}); 