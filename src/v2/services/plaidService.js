import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { logger } from '../utils/logger.js';

class PlaidService {
  constructor() {
    this.client = null;
  }

  /**
   * Initialize the service with environment variables
   */
  initialize() {
    if (!this.client) {
      // Check required environment variables
      if (!process.env.PLAID_CLIENT_ID) {
        throw new Error('PLAID_CLIENT_ID environment variable is required');
      }
      if (!process.env.PLAID_SECRET) {
        throw new Error('PLAID_SECRET environment variable is required');
      }

      const configuration = new Configuration({
        basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
        baseOptions: {
          headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
          },
        },
      });

      this.client = new PlaidApi(configuration);
      logger.info('Plaid service initialized');
    }
  }

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(publicToken) {
    this.initialize();
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken
      });
      
      logger.info('Successfully exchanged public token for access token');
      return {
        accessToken: response.data.access_token,
        itemId: response.data.item_id
      };
    } catch (error) {
      logger.error('Failed to exchange public token:', error);
      throw new Error('Failed to exchange public token');
    }
  }

  /**
   * Get accounts for an item
   */
  async getAccounts(accessToken) {
    this.initialize();
    try {
      const response = await this.client.accountsGet({
        access_token: accessToken
      });
      
      logger.info(`Retrieved ${response.data.accounts.length} accounts`);
      return response.data.accounts;
    } catch (error) {
      logger.error('Failed to get accounts:', error);
      throw new Error('Failed to retrieve accounts');
    }
  }

  /**
   * Get transactions for an item
   */
  async getTransactions(accessToken, startDate, endDate, options = {}) {
    this.initialize();
    try {
      const response = await this.client.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          include_personal_finance_category: true,
          ...options
        }
      });
      
      logger.info(`Retrieved ${response.data.transactions.length} transactions`);
      return response.data.transactions;
    } catch (error) {
      logger.error('Failed to get transactions:', error);
      throw new Error('Failed to retrieve transactions');
    }
  }

  /**
   * Get item information
   */
  async getItem(accessToken) {
    this.initialize();
    try {
      const response = await this.client.itemGet({
        access_token: accessToken
      });
      
      return response.data.item;
    } catch (error) {
      logger.error('Failed to get item:', error);
      throw new Error('Failed to retrieve item information');
    }
  }

  /**
   * Get institution information
   */
  async getInstitution(institutionId) {
    this.initialize();
    try {
      const response = await this.client.institutionsGetById({
        institution_id: institutionId,
        country_codes: ['US'],
        options: {
          include_optional_metadata: true
        }
      });
      
      return response.data.institution;
    } catch (error) {
      logger.error('Failed to get institution:', error);
      throw new Error('Failed to retrieve institution information');
    }
  }

  /**
   * Create link token for Plaid Link
   */
  async createLinkToken(userId, clientName = 'AutoAccountant') {
    this.initialize();
    try {
      const response = await this.client.linkTokenCreate({
        user: { client_user_id: userId },
        client_name: clientName,
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
      
      logger.info('Successfully created link token');
      return response.data.link_token;
    } catch (error) {
      logger.error('Failed to create link token:', error);
      throw new Error('Failed to create link token');
    }
  }

  /**
   * Update link token for re-authentication
   */
  async updateLinkToken(accessToken) {
    this.initialize();
    try {
      const response = await this.client.linkTokenCreate({
        user: { client_user_id: 'user_id' }, // This should be the actual user ID
        client_name: 'AutoAccountant',
        country_codes: ['US'],
        language: 'en',
        access_token: accessToken,
        update: {
          account_selection_enabled: false
        }
      });
      
      logger.info('Successfully created update link token');
      return response.data.link_token;
    } catch (error) {
      logger.error('Failed to create update link token:', error);
      throw new Error('Failed to create update link token');
    }
  }

  /**
   * Get categories
   */
  async getCategories() {
    this.initialize();
    try {
      const response = await this.client.categoriesGet({});
      return response.data.categories;
    } catch (error) {
      logger.error('Failed to get categories:', error);
      throw new Error('Failed to retrieve categories');
    }
  }
}

export default new PlaidService(); 