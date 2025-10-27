import Account from '../models/Account.js';
import { logger } from '../utils/logger.js';

class AccountService {
  /**
   * Store multiple accounts for an item
   */
  async storeAccounts(accounts, itemId, userId, institutionName = null) {
    try {
      const accountPromises = accounts.map(async (account) => {
        const accountData = {
          account_id: account.account_id,
          item_id: itemId,
          user_id: userId,
          name: account.name,
          official_name: account.official_name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          institution_name: institutionName,
          balances: {
            available: account.balances?.available || null,
            current: account.balances?.current || null,
            limit: account.balances?.limit || null,
            iso_currency_code: account.balances?.iso_currency_code || 'USD',
            unofficial_currency_code: account.balances?.unofficial_currency_code || null
          }
        };

        // Use upsert to handle updates
        return Account.findOneAndUpdate(
          { account_id: account.account_id },
          accountData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      });

      const storedAccounts = await Promise.all(accountPromises);
      logger.info(`Stored ${storedAccounts.length} accounts for item: ${itemId}`);
      return storedAccounts;
    } catch (error) {
      logger.error('Failed to store accounts:', error);
      throw error;
    }
  }

  /**
   * Get accounts by user ID
   */
  async getAccountsByUserId(userId) {
    try {
      const accounts = await Account.find({ user_id: userId, status: 'active' })
        .sort({ type: 1, name: 1 });
      return accounts;
    } catch (error) {
      logger.error('Failed to get accounts by user ID:', error);
      throw error;
    }
  }

  /**
   * Get accounts by item ID
   */
  async getAccountsByItemId(itemId) {
    try {
      const accounts = await Account.find({ item_id: itemId, status: 'active' })
        .sort({ type: 1, name: 1 });
      return accounts;
    } catch (error) {
      logger.error('Failed to get accounts by item ID:', error);
      throw error;
    }
  }

  /**
   * Get account by account ID
   */
  async getAccountByAccountId(accountId) {
    try {
      const account = await Account.findOne({ account_id: accountId });
      return account;
    } catch (error) {
      logger.error('Failed to get account by account ID:', error);
      throw error;
    }
  }

  /**
   * Update account balances
   */
  async updateAccountBalances(accountId, balances) {
    try {
      const account = await Account.findOneAndUpdate(
        { account_id: accountId },
        { 
          balances: {
            available: balances.available || null,
            current: balances.current || null,
            limit: balances.limit || null,
            iso_currency_code: balances.iso_currency_code || 'USD',
            unofficial_currency_code: balances.unofficial_currency_code || null
          },
          updated_at: new Date()
        },
        { new: true }
      );
      
      logger.info(`Updated balances for account: ${accountId}`);
      return account;
    } catch (error) {
      logger.error('Failed to update account balances:', error);
      throw error;
    }
  }

  /**
   * Update account status
   */
  async updateAccountStatus(accountId, status) {
    try {
      const account = await Account.findOneAndUpdate(
        { account_id: accountId },
        { 
          status: status,
          updated_at: new Date()
        },
        { new: true }
      );
      
      logger.info(`Updated status for account: ${accountId} to ${status}`);
      return account;
    } catch (error) {
      logger.error('Failed to update account status:', error);
      throw error;
    }
  }

  /**
   * Delete accounts by item ID
   */
  async deleteAccountsByItemId(itemId) {
    try {
      const result = await Account.deleteMany({ item_id: itemId });
      logger.info(`Deleted ${result.deletedCount} accounts for item: ${itemId}`);
      return result;
    } catch (error) {
      logger.error('Failed to delete accounts by item ID:', error);
      throw error;
    }
  }

  /**
   * Get accounts grouped by type
   */
  async getAccountsGroupedByType(userId) {
    try {
      const accounts = await Account.find({ user_id: userId, status: 'active' })
        .sort({ type: 1, name: 1 });
      
      const grouped = accounts.reduce((acc, account) => {
        if (!acc[account.type]) {
          acc[account.type] = [];
        }
        acc[account.type].push(account);
        return acc;
      }, {});

      return grouped;
    } catch (error) {
      logger.error('Failed to get accounts grouped by type:', error);
      throw error;
    }
  }

  /**
   * Get account statistics
   */
  async getAccountStatistics(userId) {
    try {
      const accounts = await Account.find({ user_id: userId, status: 'active' });
      
      const stats = {
        total_accounts: accounts.length,
        by_type: {},
        total_balance: 0,
        total_available: 0
      };

      accounts.forEach(account => {
        // Count by type
        if (!stats.by_type[account.type]) {
          stats.by_type[account.type] = 0;
        }
        stats.by_type[account.type]++;

        // Sum balances (only for depository accounts)
        if (account.type === 'depository' && account.balances.current !== null) {
          stats.total_balance += account.balances.current;
        }
        if (account.type === 'depository' && account.balances.available !== null) {
          stats.total_available += account.balances.available;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get account statistics:', error);
      throw error;
    }
  }

  /**
   * Check if account exists
   */
  async accountExists(accountId) {
    try {
      const account = await Account.findOne({ account_id: accountId });
      return !!account;
    } catch (error) {
      logger.error('Failed to check if account exists:', error);
      throw error;
    }
  }
}

export default new AccountService();
