import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import databaseService from './services/databaseService.js';

// Import routes
import plaidRoutes from './routes/plaid.js';
import webhookRoutes from './routes/webhooks.js';
import sheetsRoutes from './routes/sheets.js';

// Load environment variables
dotenv.config();

// Debug: Log environment variables (remove in production)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Environment variables loaded:');
  console.log('PLAID_CLIENT_ID:', process.env.PLAID_CLIENT_ID ? '✅ Set' : '❌ Missing');
  console.log('PLAID_SECRET:', process.env.PLAID_SECRET ? '✅ Set' : '❌ Missing');
  console.log('PLAID_ENV:', process.env.PLAID_ENV || '❌ Missing');
  console.log('GOOGLE_SHEETS_SPREADSHEET_ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? '✅ Set' : '❌ Missing');
  console.log('GOOGLE_SERVICE_ACCOUNT_KEY_FILE:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE ? '✅ Set' : '❌ Missing');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
  console.log('');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Serve static files
app.use(express.static('src/v2/public'));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/plaid', plaidRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/sheets', sheetsRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await databaseService.connect();
    
    app.listen(PORT, () => {
      logger.info(`🚀 AutoAccountant server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 