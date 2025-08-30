import { google } from 'googleapis';
import { logger } from '../utils/logger.js';

class SheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = null;
  }

  /**
   * Initialize the service with environment variables
   */
  initialize() {
    if (!this.auth) {
      // Check required environment variables
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
        throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_FILE environment variable is required');
      }
      if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
        throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required');
      }

      this.auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
      
      logger.info('Google Sheets service initialized');
    }
  }

  /**
   * Initialize the spreadsheet with headers
   */
  async initializeSpreadsheet() {
    this.initialize();
    try {
      const headers = [
        'Transaction ID',
        'Account ID',
        'Account Name',
        'Institution',
        'Date',
        'Amount',
        'Currency',
        'Merchant Name',
        'Category',
        'Subcategory',
        'Category ID',
        'Pending',
        'Payment Channel',
        'Transaction Type',
        'User Category',
        'User Notes',
        'Created At',
        'Updated At'
      ];

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!A1:R1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });

      // Format headers
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }
          ]
        }
      });

      logger.info('Spreadsheet initialized with headers');
    } catch (error) {
      logger.error('Failed to initialize spreadsheet:', error);
      throw new Error('Failed to initialize spreadsheet');
    }
  }

  /**
   * Add a single transaction to the spreadsheet
   */
  async addTransaction(transaction) {
    this.initialize();
    try {
      const row = [
        transaction.transaction_id,
        transaction.account_id,
        transaction.account_name || '',
        transaction.institution_name || '',
        transaction.date,
        transaction.amount,
        transaction.iso_currency_code || 'USD',
        transaction.merchant_name || transaction.name,
        transaction.personal_finance_category?.primary || '',
        transaction.personal_finance_category?.detailed || '',
        transaction.personal_finance_category?.category_id || '',
        transaction.pending,
        transaction.payment_channel,
        transaction.transaction_type,
        '', // User Category (to be filled later)
        '', // User Notes (to be filled later)
        new Date().toISOString(),
        new Date().toISOString()
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!A:R',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [row]
        }
      });

      logger.info(`Added transaction ${transaction.transaction_id} to spreadsheet`);
    } catch (error) {
      logger.error('Failed to add transaction to spreadsheet:', error);
      throw new Error('Failed to add transaction to spreadsheet');
    }
  }

  /**
   * Add multiple transactions to the spreadsheet
   */
  async addTransactions(transactions) {
    this.initialize();
    try {
      if (!transactions || transactions.length === 0) {
        logger.info('No transactions to add');
        return;
      }

      const rows = transactions.map(transaction => [
        transaction.transaction_id,
        transaction.account_id,
        transaction.account_name || '',
        transaction.institution_name || '',
        transaction.date,
        transaction.amount,
        transaction.iso_currency_code || 'USD',
        transaction.merchant_name || transaction.name,
        transaction.personal_finance_category?.primary || '',
        transaction.personal_finance_category?.detailed || '',
        transaction.personal_finance_category?.category_id || '',
        transaction.pending,
        transaction.payment_channel,
        transaction.transaction_type,
        '', // User Category
        '', // User Notes
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!A:R',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: rows
        }
      });

      logger.info(`Added ${transactions.length} transactions to spreadsheet`);
    } catch (error) {
      logger.error('Failed to add transactions to spreadsheet:', error);
      throw new Error('Failed to add transactions to spreadsheet');
    }
  }

  /**
   * Get all transactions from the spreadsheet
   */
  async getTransactions() {
    this.initialize();
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!A:R'
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) {
        return []; // Only headers or empty
      }

      // Skip header row and convert to objects
      const transactions = rows.slice(1).map(row => ({
        transaction_id: row[0],
        account_id: row[1],
        account_name: row[2],
        institution_name: row[3],
        date: row[4],
        amount: parseFloat(row[5]),
        currency: row[6],
        merchant_name: row[7],
        category: row[8],
        subcategory: row[9],
        category_id: row[10],
        pending: row[11] === 'true',
        payment_channel: row[12],
        transaction_type: row[13],
        user_category: row[14],
        user_notes: row[15],
        created_at: row[16],
        updated_at: row[17]
      }));

      logger.info(`Retrieved ${transactions.length} transactions from spreadsheet`);
      return transactions;
    } catch (error) {
      logger.error('Failed to get transactions from spreadsheet:', error);
      throw new Error('Failed to retrieve transactions from spreadsheet');
    }
  }

  /**
   * Update a transaction's user category and notes
   */
  async updateTransactionCategory(transactionId, userCategory, userNotes) {
    this.initialize();
    try {
      // First, find the row with this transaction ID
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!A:A'
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === transactionId);
      
      if (rowIndex === -1) {
        throw new Error('Transaction not found');
      }

      // Update the user category and notes (columns O and P)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Transactions!O${rowIndex + 1}:P${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[userCategory, userNotes]]
        }
      });

      // Update the updated_at timestamp (column R)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Transactions!R${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[new Date().toISOString()]]
        }
      });

      logger.info(`Updated transaction ${transactionId} with category: ${userCategory}`);
    } catch (error) {
      logger.error('Failed to update transaction category:', error);
      throw new Error('Failed to update transaction category');
    }
  }

  /**
   * Check if a transaction already exists in the spreadsheet
   */
  async transactionExists(transactionId) {
    this.initialize();
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!A:A'
      });

      const rows = response.data.values || [];
      return rows.some(row => row[0] === transactionId);
    } catch (error) {
      logger.error('Failed to check if transaction exists:', error);
      return false;
    }
  }

  /**
   * Get unique categories from the spreadsheet
   */
  async getUniqueCategories() {
    this.initialize();
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Transactions!O:O'
      });

      const rows = response.data.values || [];
      const categories = rows.slice(1) // Skip header
        .map(row => row[0])
        .filter(category => category && category.trim() !== '');

      const uniqueCategories = [...new Set(categories)];
      return uniqueCategories;
    } catch (error) {
      logger.error('Failed to get unique categories:', error);
      return [];
    }
  }
}

export default new SheetsService(); 