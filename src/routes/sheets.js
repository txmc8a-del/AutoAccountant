import express from 'express';
import { body, validationResult } from 'express-validator';
import sheetsService from '../services/sheetsService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Validation middleware
const validateTransactionId = [
  body('transaction_id').notEmpty().withMessage('Transaction ID is required')
];

const validateCategoryUpdate = [
  body('transaction_id').notEmpty().withMessage('Transaction ID is required'),
  body('user_category').notEmpty().withMessage('User category is required')
];

// Initialize spreadsheet
router.post('/initialize', async (req, res) => {
  try {
    await sheetsService.initializeSpreadsheet();
    res.json({ message: 'Spreadsheet initialized successfully' });
  } catch (error) {
    logger.error('Failed to initialize spreadsheet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 100, category, start_date, end_date } = req.query;
    
    let transactions = await sheetsService.getTransactions();
    
    // Filter by category if provided
    if (category) {
      transactions = transactions.filter(t => 
        t.user_category === category || t.category === category
      );
    }
    
    // Filter by date range if provided
    if (start_date || end_date) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const start = start_date ? new Date(start_date) : new Date(0);
        const end = end_date ? new Date(end_date) : new Date();
        return transactionDate >= start && transactionDate <= end;
      });
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = transactions.slice(startIndex, endIndex);
    
    res.json({
      transactions: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transactions.length,
        total_pages: Math.ceil(transactions.length / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction by ID
router.get('/transactions/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transactions = await sheetsService.getTransactions();
    const transaction = transactions.find(t => t.transaction_id === transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ transaction });
  } catch (error) {
    logger.error('Failed to get transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update transaction category and notes
router.put('/transactions/:transactionId/category', validateCategoryUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { transactionId } = req.params;
    const { user_category, user_notes = '' } = req.body;
    
    await sheetsService.updateTransactionCategory(transactionId, user_category, user_notes);
    
    res.json({ 
      message: 'Transaction category updated successfully',
      transaction_id: transactionId,
      user_category,
      user_notes
    });
  } catch (error) {
    logger.error('Failed to update transaction category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get unique categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await sheetsService.getUniqueCategories();
    res.json({ categories });
  } catch (error) {
    logger.error('Failed to get categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transaction statistics
router.get('/statistics', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let transactions = await sheetsService.getTransactions();
    
    // Filter by date range if provided
    if (start_date || end_date) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const start = start_date ? new Date(start_date) : new Date(0);
        const end = end_date ? new Date(end_date) : new Date();
        return transactionDate >= start && transactionDate <= end;
      });
    }
    
    // Calculate statistics
    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    // Category breakdown
    const categoryBreakdown = transactions.reduce((acc, t) => {
      const category = t.user_category || t.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});
    
    // Monthly breakdown
    const monthlyBreakdown = transactions.reduce((acc, t) => {
      const month = new Date(t.date).toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + Math.abs(t.amount);
      return acc;
    }, {});
    
    // Top merchants
    const merchantBreakdown = transactions.reduce((acc, t) => {
      const merchant = t.merchant_name || 'Unknown';
      acc[merchant] = (acc[merchant] || 0) + Math.abs(t.amount);
      return acc;
    }, {});
    
    const topMerchants = Object.entries(merchantBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([merchant, amount]) => ({ merchant, amount }));
    
    res.json({
      total_transactions: totalTransactions,
      total_amount: totalAmount,
      average_amount: averageAmount,
      category_breakdown: categoryBreakdown,
      monthly_breakdown: monthlyBreakdown,
      top_merchants: topMerchants
    });
  } catch (error) {
    logger.error('Failed to get statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search transactions
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1, limit = 100 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    let transactions = await sheetsService.getTransactions();
    
    // Search in merchant name, category, and notes
    const searchResults = transactions.filter(t => {
      const searchFields = [
        t.merchant_name,
        t.user_category,
        t.category,
        t.user_notes
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchFields.includes(query.toLowerCase());
    });
    
    // Sort by date (newest first)
    searchResults.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = searchResults.slice(startIndex, endIndex);
    
    res.json({
      transactions: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: searchResults.length,
        total_pages: Math.ceil(searchResults.length / limit)
      },
      query
    });
  } catch (error) {
    logger.error('Failed to search transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export transactions to CSV format
router.get('/export', async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    if (format !== 'csv') {
      return res.status(400).json({ error: 'Only CSV export is supported' });
    }
    
    const transactions = await sheetsService.getTransactions();
    
    // Create CSV content
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
      'User Category',
      'User Notes',
      'Pending',
      'Payment Channel',
      'Transaction Type'
    ];
    
    const csvRows = [headers.join(',')];
    
    transactions.forEach(t => {
      const row = [
        t.transaction_id,
        t.account_id,
        `"${t.account_name || ''}"`,
        `"${t.institution_name || ''}"`,
        t.date,
        t.amount,
        t.currency,
        `"${t.merchant_name || ''}"`,
        `"${t.category || ''}"`,
        `"${t.subcategory || ''}"`,
        `"${t.user_category || ''}"`,
        `"${t.user_notes || ''}"`,
        t.pending,
        t.payment_channel,
        t.transaction_type
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    logger.error('Failed to export transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 