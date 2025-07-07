// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set default test environment variables if not present
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 