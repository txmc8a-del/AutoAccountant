import express from 'express';
import { body, validationResult } from 'express-validator';
import plaidService from '../services/plaidService.js';
import sheetsService from '../services/sheetsService.js';
import { logger } from '../utils/logger.js';
import { sendNotification } from '../services/notificationService.js';

const router = express.Router();

// Validation middleware for webhook payload
const validateWebhookPayload = [
  body('webhook_type').isIn(['TRANSACTIONS', 'ITEM', 'ACCOUNTS']).withMessage('Invalid webhook type'),
  body('webhook_code').notEmpty().withMessage('Webhook code is required'),
  body('item_id').notEmpty().withMessage('Item ID is required')
];

// Webhook endpoint for Plaid notifications
router.post('/plaid', validateWebhookPayload, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Invalid webhook payload:', errors.array());
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const { webhook_type, webhook_code, item_id, new_transactions, removed_transactions } = req.body;

    logger.info(`Received webhook: ${webhook_type}.${webhook_code} for item ${item_id}`);

    // Handle different webhook types
    switch (webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionWebhook(webhook_code, item_id, new_transactions, removed_transactions);
        break;
      
      case 'ITEM':
        await handleItemWebhook(webhook_code, item_id, req.body);
        break;
      
      case 'ACCOUNTS':
        await handleAccountWebhook(webhook_code, item_id, req.body);
        break;
      
      default:
        logger.warn(`Unhandled webhook type: ${webhook_type}`);
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ status: 'OK' });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    // Still return 200 to prevent Plaid from retrying
    res.status(200).json({ status: 'OK', error: error.message });
  }
});

// Handle transaction-related webhooks
async function handleTransactionWebhook(webhookCode, itemId, newTransactions, removedTransactions) {
  switch (webhookCode) {
    case 'INITIAL_UPDATE':
      logger.info(`Initial update for item ${itemId} with ${newTransactions?.length || 0} new transactions`);
      if (newTransactions && newTransactions.length > 0) {
        await processNewTransactions(newTransactions);
      }
      break;

    case 'HISTORICAL_UPDATE':
      logger.info(`Historical update for item ${itemId} with ${newTransactions?.length || 0} new transactions`);
      if (newTransactions && newTransactions.length > 0) {
        await processNewTransactions(newTransactions);
      }
      break;

    case 'DEFAULT_UPDATE':
      logger.info(`Default update for item ${itemId} with ${newTransactions?.length || 0} new transactions`);
      if (newTransactions && newTransactions.length > 0) {
        await processNewTransactions(newTransactions);
      }
      break;

    case 'TRANSACTIONS_REMOVED':
      logger.info(`Transactions removed for item ${itemId}: ${removedTransactions?.length || 0} transactions`);
      // Note: We don't remove from Google Sheets as it's a historical record
      break;

    default:
      logger.warn(`Unhandled transaction webhook code: ${webhookCode}`);
  }
}

// Handle item-related webhooks
async function handleItemWebhook(webhookCode, itemId, payload) {
  switch (webhookCode) {
    case 'ERROR':
      logger.error(`Item error for ${itemId}:`, payload.error);
      // Could send notification to user about connection issues
      break;

    case 'PENDING_EXPIRATION':
      logger.warn(`Item ${itemId} will expire soon`);
      // Could send notification to user to re-authenticate
      break;

    case 'USER_PERMISSION_REVOKED':
      logger.warn(`User permission revoked for item ${itemId}`);
      // Could send notification to user about revoked access
      break;

    default:
      logger.warn(`Unhandled item webhook code: ${webhookCode}`);
  }
}

// Handle account-related webhooks
async function handleAccountWebhook(webhookCode, itemId, payload) {
  switch (webhookCode) {
    case 'ERROR':
      logger.error(`Account error for item ${itemId}:`, payload.error);
      break;

    default:
      logger.warn(`Unhandled account webhook code: ${webhookCode}`);
  }
}

// Process new transactions and send notifications
async function processNewTransactions(transactions) {
  try {
    // Filter out transactions that already exist in the spreadsheet
    const newTransactions = [];
    for (const transaction of transactions) {
      const exists = await sheetsService.transactionExists(transaction.transaction_id);
      if (!exists) {
        newTransactions.push(transaction);
      }
    }

    if (newTransactions.length > 0) {
      // Add new transactions to Google Sheets
      await sheetsService.addTransactions(newTransactions);
      logger.info(`Added ${newTransactions.length} new transactions to spreadsheet`);

      // Send notifications for each new transaction
      for (const transaction of newTransactions) {
        await sendTransactionNotification(transaction);
      }
    }
  } catch (error) {
    logger.error('Error processing new transactions:', error);
    throw error;
  }
}

// Send notification for a new transaction
async function sendTransactionNotification(transaction) {
  try {
    const message = {
      title: 'New Transaction Detected',
      body: `${transaction.merchant_name || transaction.name} - $${Math.abs(transaction.amount).toFixed(2)}`,
      data: {
        transaction_id: transaction.transaction_id,
        amount: transaction.amount,
        merchant: transaction.merchant_name || transaction.name,
        date: transaction.date,
        category: transaction.personal_finance_category?.primary || 'Uncategorized'
      }
    };

    await sendNotification(message);
    logger.info(`Sent notification for transaction ${transaction.transaction_id}`);
  } catch (error) {
    logger.error('Failed to send transaction notification:', error);
  }
}

// Health check for webhook endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Webhook endpoint is healthy'
  });
});

export default router; 