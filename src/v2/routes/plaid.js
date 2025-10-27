import express from 'express';
import { body, validationResult } from 'express-validator';
import plaidService from '../services/plaidService.js';
import sheetsService from '../services/sheetsService.js';
import itemService from '../services/itemService.js';
import accountService from '../services/accountService.js';
import { logger } from '../utils/logger.js';
import moment from 'moment';

const router = express.Router();

// Validation middleware
const validatePublicToken = [
  body('public_token').notEmpty().withMessage('Public token is required')
];

const validateAccessToken = [
  body('access_token').notEmpty().withMessage('Access token is required')
];

const validateDateRange = [
  body('start_date').isISO8601().withMessage('Start date must be in ISO format'),
  body('end_date').isISO8601().withMessage('End date must be in ISO format')
];

// Get Plaid configuration
router.get('/config', (req, res) => {
  res.json({
    plaid_env: process.env.PLAID_ENV || 'sandbox',
    webhook_url: process.env.PLAID_WEBHOOK_URL
  });
});

// Create link token for Plaid Link
router.post('/create-link-token', async (req, res) => {
  try {
    const { userId, clientName } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const linkToken = await plaidService.createLinkToken(userId, clientName);
    res.json({ link_token: linkToken });
  } catch (error) {
    logger.error('Failed to create link token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Exchange public token for access token
router.post('/exchange-token', validatePublicToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { public_token, user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const result = await plaidService.exchangePublicToken(public_token);
    
    // Get item and institution information
    const item = await plaidService.getItem(result.accessToken);
    const institution = await plaidService.getInstitution(item.institution_id);
    
    // Get accounts from Plaid
    const accounts = await plaidService.getAccounts(result.accessToken);
    
    // Store the item in the database
    await itemService.storeItem(
      result.accessToken,
      result.itemId,
      user_id,
      {
        institution_id: item.institution_id,
        name: institution.name
      }
    );
    
    // Store accounts in the database
    await accountService.storeAccounts(
      accounts,
      result.itemId,
      user_id,
      institution.name
    );
    
    res.json({
      access_token: result.accessToken,
      item_id: result.itemId,
      institution: institution,
      accounts: accounts,
      message: 'Account connected successfully'
    });
  } catch (error) {
    logger.error('Failed to exchange token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get accounts for an item
router.post('/accounts', validateAccessToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { access_token } = req.body;
    const accounts = await plaidService.getAccounts(access_token);
    
    res.json({ accounts });
  } catch (error) {
    logger.error('Failed to get accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transactions for an item
router.post('/transactions', [...validateAccessToken, ...validateDateRange], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { access_token, start_date, end_date, options = {} } = req.body;
    const transactions = await plaidService.getTransactions(access_token, start_date, end_date, options);
    
    res.json({ transactions });
  } catch (error) {
    logger.error('Failed to get transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get historical transactions and store in Google Sheets
router.post('/sync-transactions', validateAccessToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { access_token, days_back = 730 } = req.body; // Default to 2 years
    
    const endDate = moment().format('YYYY-MM-DD');
    const startDate = moment().subtract(days_back, 'days').format('YYYY-MM-DD');
    
    logger.info(`Syncing transactions from ${startDate} to ${endDate}`);
    
    const transactions = await plaidService.getTransactions(access_token, startDate, endDate);
    
    // Filter out transactions that already exist in the spreadsheet
    const newTransactions = [];
    for (const transaction of transactions) {
      const exists = await sheetsService.transactionExists(transaction.transaction_id);
      if (!exists) {
        newTransactions.push(transaction);
      }
    }
    
    if (newTransactions.length > 0) {
      await sheetsService.addTransactions(newTransactions);
      logger.info(`Added ${newTransactions.length} new transactions to spreadsheet`);
    }
    
    res.json({
      total_transactions: transactions.length,
      new_transactions: newTransactions.length,
      message: `Successfully synced ${newTransactions.length} new transactions`
    });
  } catch (error) {
    logger.error('Failed to sync transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get item information
router.post('/item', validateAccessToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { access_token } = req.body;
    const item = await plaidService.getItem(access_token);
    const institution = await plaidService.getInstitution(item.institution_id);
    
    res.json({
      item,
      institution
    });
  } catch (error) {
    logger.error('Failed to get item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await plaidService.getCategories();
    res.json({ categories });
  } catch (error) {
    logger.error('Failed to get categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update link token for re-authentication
router.post('/update-link-token', validateAccessToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { access_token } = req.body;
    const linkToken = await plaidService.updateLinkToken(access_token);
    
    res.json({ link_token: linkToken });
  } catch (error) {
    logger.error('Failed to create update link token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's connected accounts from MongoDB
router.get('/accounts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const accounts = await accountService.getAccountsByUserId(userId);
    
    res.json({ accounts });
  } catch (error) {
    logger.error('Failed to get user accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's connected items from MongoDB
router.get('/items/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const items = await itemService.getItemsByUserId(userId);
    
    res.json({ items });
  } catch (error) {
    logger.error('Failed to get user items:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get accounts from Plaid API (for refreshing data)
router.post('/accounts/refresh', validateAccessToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { access_token, user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get accounts from Plaid
    const accounts = await plaidService.getAccounts(access_token);
    
    // Get item info to find item_id
    const item = await plaidService.getItem(access_token);
    const institution = await plaidService.getInstitution(item.institution_id);
    
    // Update accounts in MongoDB
    await accountService.storeAccounts(
      accounts,
      item.item_id,
      user_id,
      institution.name
    );
    
    res.json({ 
      accounts,
      message: 'Accounts refreshed successfully'
    });
  } catch (error) {
    logger.error('Failed to refresh accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific item details
router.get('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await itemService.getItemByItemId(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ item });
  } catch (error) {
    logger.error('Failed to get item details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a connected account
router.delete('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Delete accounts first
    await accountService.deleteAccountsByItemId(itemId);
    
    // Then delete the item
    await itemService.deleteItem(itemId);
    
    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    logger.error('Failed to delete item:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get account statistics
router.get('/accounts/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await accountService.getAccountStatistics(userId);
    
    res.json({ stats });
  } catch (error) {
    logger.error('Failed to get account statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get accounts grouped by type
router.get('/accounts/:userId/grouped', async (req, res) => {
  try {
    const { userId } = req.params;
    const groupedAccounts = await accountService.getAccountsGroupedByType(userId);
    
    res.json({ accounts: groupedAccounts });
  } catch (error) {
    logger.error('Failed to get grouped accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 