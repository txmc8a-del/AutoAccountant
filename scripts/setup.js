#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 AutoAccountant Setup Script');
console.log('==============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envExamplePath = path.join(__dirname, '..', 'env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully!');
    console.log('⚠️  Please update the .env file with your actual credentials.\n');
  } else {
    console.log('❌ env.example file not found!');
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists.\n');
}

// Create logs directory
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  console.log('📁 Creating logs directory...');
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Logs directory created successfully!\n');
} else {
  console.log('✅ Logs directory already exists.\n');
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
  console.log('❌ Node.js 18+ is required. Current version:', nodeVersion);
  console.log('Please upgrade Node.js to continue.\n');
  process.exit(1);
} else {
  console.log('✅ Node.js version check passed:', nodeVersion, '\n');
}

// Check if dependencies are installed
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');

if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  console.log('Run: npm install\n');
} else {
  console.log('✅ Dependencies are installed.\n');
}

console.log('🎉 Setup complete!');
console.log('\nNext steps:');
console.log('1. Update .env file with your credentials');
console.log('2. Run: npm install (if not already done)');
console.log('3. Run: npm run dev');
console.log('4. Initialize spreadsheet: curl -X POST http://localhost:3000/api/sheets/initialize');
console.log('\n📚 Check README.md for detailed setup instructions.\n'); 