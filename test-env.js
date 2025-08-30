#!/usr/bin/env node

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Environment Variable Test');
console.log('============================\n');

// Check if .env file exists
const envPath = join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found at:', envPath);
  console.log('Please create a .env file based on env.example\n');
  process.exit(1);
}

console.log('✅ .env file found at:', envPath);
console.log('📄 File size:', fs.statSync(envPath).size, 'bytes\n');

// Load environment variables
dotenv.config();

console.log('🔧 Environment variables loaded:');
console.log('PLAID_CLIENT_ID:', process.env.PLAID_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('PLAID_SECRET:', process.env.PLAID_SECRET ? '✅ Set' : '❌ Missing');
console.log('PLAID_ENV:', process.env.PLAID_ENV || '❌ Missing');
console.log('GOOGLE_SHEETS_SPREADSHEET_ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_SERVICE_ACCOUNT_KEY_FILE:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ? '✅ Set' : '❌ Missing');
console.log('NODE_ENV:', process.env.NODE_ENV || '❌ Missing');
console.log('PORT:', process.env.PORT || '❌ Missing (will use default 3000)');

// Check if Google service account key file exists
if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
  const keyPath = join(__dirname, process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE);
  if (fs.existsSync(keyPath)) {
    console.log('✅ Google service account key file found');
  } else {
    console.log('❌ Google service account key file not found at:', keyPath);
  }
}

console.log('\n📋 Summary:');
const requiredVars = [
  'PLAID_CLIENT_ID',
  'PLAID_SECRET', 
  'PLAID_ENV',
  'GOOGLE_SHEETS_SPREADSHEET_ID',
  'GOOGLE_SERVICE_ACCOUNT_KEY_FILE'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length === 0) {
  console.log('✅ All required environment variables are set!');
} else {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\nPlease update your .env file with the missing variables.');
}
