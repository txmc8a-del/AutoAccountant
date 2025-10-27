# AutoAccountant v2.0

> Modern realtime accountant and budget manager system with Plaid integration and Google Sheets storage

## 🚀 Features

- **Plaid Integration**: Connect credit cards, bank accounts, brokerage accounts, and retirement accounts
- **Real-time Transaction Monitoring**: Webhook-based notifications for new transactions
- **Google Sheets Storage**: All transaction data stored in Google Sheets for easy access and analysis
- **Smart Categorization**: Automatic categorization with manual override capabilities
- **Push Notifications**: Instant alerts for new transactions via Slack, Discord, email, or push notifications
- **Historical Data Sync**: Pull up to 2 years of historical transaction data
- **Modern API**: RESTful API with comprehensive validation and error handling

## 🏗️ Architecture

### Backend Stack
- **Node.js** with ES modules
- **Express.js** for API server
- **Plaid API** for financial data
- **Google Sheets API** for data storage
- **Winston** for structured logging
- **Express Validator** for input validation

### Key Components
- **Plaid Service**: Handles all Plaid API interactions
- **Google Sheets Service**: Manages transaction storage and retrieval
- **Notification Service**: Sends alerts via multiple channels
- **Webhook Handler**: Processes real-time transaction updates
- **REST API**: Complete CRUD operations for transactions

## 📋 Prerequisites

- Node.js 18+ 
- Plaid API account
- Google Cloud Project with Sheets API enabled
- Google Service Account with Sheets permissions
- Mongodb Server

## 🛠️ Developer Tooling
- mongosh

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd AutoAccountant
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```env
# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
PLAID_WEBHOOK_URL=https://your-domain.com/api/webhooks/plaid

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=path/to/your/service-account-key.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_google_sheets_spreadsheet_id

# Notification Configuration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
```

### 3. Google Sheets Setup

1. Create a new Google Sheet
2. Enable Google Sheets API in your Google Cloud Console
3. Create a Service Account and download the JSON key file
4. Share your Google Sheet with the service account email
5. Update the `GOOGLE_SHEETS_SPREADSHEET_ID` in your `.env` file

### 4. Initialize the Spreadsheet

```bash
curl -X POST http://localhost:3000/api/sheets/initialize
```

### 5. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

## 📚 API Documentation

### Plaid Integration

#### Create Link Token
```http
POST /api/plaid/create-link-token
Content-Type: application/json

{
  "userId": "user123",
  "clientName": "AutoAccountant"
}
```

#### Exchange Public Token
```http
POST /api/plaid/exchange-token
Content-Type: application/json

{
  "public_token": "public-sandbox-token"
}
```

#### Sync Historical Transactions
```http
POST /api/plaid/sync-transactions
Content-Type: application/json

{
  "access_token": "access-sandbox-token",
  "days_back": 730
}
```

### Transaction Management

#### Get All Transactions
```http
GET /api/sheets/transactions?page=1&limit=100&category=Food&start_date=2024-01-01
```

#### Update Transaction Category
```http
PUT /api/sheets/transactions/{transactionId}/category
Content-Type: application/json

{
  "user_category": "Groceries",
  "user_notes": "Weekly grocery shopping"
}
```

#### Get Statistics
```http
GET /api/sheets/statistics?start_date=2024-01-01&end_date=2024-12-31
```

#### Search Transactions
```http
GET /api/sheets/search?query=starbucks&page=1&limit=50
```

#### Export to CSV
```http
GET /api/sheets/export?format=csv
```

### Webhooks

The webhook endpoint automatically processes new transactions from Plaid:

```http
POST /api/webhooks/plaid
```

## 🔔 Notifications

The system supports multiple notification channels:

- **Slack**: Rich formatted messages with transaction details
- **Discord**: Embedded messages with transaction information
- **Email**: HTML formatted emails (requires email service integration)
- **Push Notifications**: Mobile push notifications (requires push service integration)

## 🧪 Testing

```bash
# Run tests
npm test

# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/plaid \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_type": "TRANSACTIONS",
    "webhook_code": "DEFAULT_UPDATE",
    "item_id": "test-item",
    "new_transactions": []
  }'

# Test notification service
curl -X POST http://localhost:3000/api/test-notification
```

## 📊 Data Flow

1. **Account Connection**: User connects accounts via Plaid Link
2. **Historical Sync**: System pulls up to 2 years of historical transactions
3. **Real-time Monitoring**: Webhooks notify of new transactions
4. **Storage**: All transactions stored in Google Sheets
5. **Categorization**: Users can categorize and annotate transactions
6. **Notifications**: Alerts sent for new transactions
7. **Analysis**: Rich API for querying and analyzing transaction data

## 🔧 Development

### Project Structure
```
src/
├── server.js              # Main server file
├── routes/                # API routes
│   ├── plaid.js          # Plaid integration routes
│   ├── webhooks.js       # Webhook handlers
│   └── sheets.js         # Google Sheets routes
├── services/             # Business logic
│   ├── plaidService.js   # Plaid API service
│   ├── sheetsService.js  # Google Sheets service
│   └── notificationService.js # Notification service
├── middleware/           # Express middleware
│   ├── errorHandler.js   # Error handling
│   └── notFoundHandler.js # 404 handler
└── utils/               # Utilities
    └── logger.js        # Winston logger
```

### Adding New Features

1. **New API Endpoints**: Add routes in `src/routes/`
2. **Business Logic**: Create services in `src/services/`
3. **Validation**: Use Express Validator for input validation
4. **Error Handling**: Use the centralized error handler
5. **Logging**: Use the Winston logger for consistent logging

## 🚀 Deployment

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure `PLAID_ENV=development` or `PLAID_ENV=production`
- Set up proper `ALLOWED_ORIGINS`
- Configure notification webhooks
- Use HTTPS for webhook endpoints

### Recommended Hosting
- **Vercel**: Easy deployment with serverless functions
- **Railway**: Simple Node.js deployment
- **Heroku**: Traditional hosting with add-ons
- **AWS/GCP**: Full control with cloud services

## 📝 License

GPL-3.0 - see [LICENSE](LICENSE) for details

## 👨‍💻 Author

**Ananth Rao** (@ananthamapod)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the API documentation
- Review the logs for debugging information
