# AutoAccountant API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently, the API doesn't require authentication. In production, you should implement proper authentication.

## Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Plaid Integration

### Get Plaid Configuration
```http
GET /plaid/config
```

**Response:**
```json
{
  "plaid_env": "sandbox",
  "webhook_url": "https://your-domain.com/api/webhooks/plaid"
}
```

### Create Link Token
```http
POST /plaid/create-link-token
Content-Type: application/json

{
  "userId": "user123",
  "clientName": "AutoAccountant"
}
```

**Response:**
```json
{
  "link_token": "link-sandbox-token"
}
```

### Exchange Public Token
```http
POST /plaid/exchange-token
Content-Type: application/json

{
  "public_token": "public-sandbox-token"
}
```

**Response:**
```json
{
  "access_token": "access-sandbox-token",
  "item_id": "item-sandbox-id"
}
```

### Get Accounts
```http
POST /plaid/accounts
Content-Type: application/json

{
  "access_token": "access-sandbox-token"
}
```

**Response:**
```json
{
  "accounts": [
    {
      "account_id": "acc1",
      "name": "Checking Account",
      "type": "depository",
      "subtype": "checking"
    }
  ]
}
```

### Get Transactions
```http
POST /plaid/transactions
Content-Type: application/json

{
  "access_token": "access-sandbox-token",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "options": {
    "count": 100,
    "offset": 0
  }
}
```

**Response:**
```json
{
  "transactions": [
    {
      "transaction_id": "txn1",
      "account_id": "acc1",
      "amount": -25.50,
      "date": "2024-01-15",
      "merchant_name": "Starbucks",
      "category": ["Food and Drink", "Restaurants"],
      "pending": false
    }
  ]
}
```

### Sync Historical Transactions
```http
POST /plaid/sync-transactions
Content-Type: application/json

{
  "access_token": "access-sandbox-token",
  "days_back": 730
}
```

**Response:**
```json
{
  "total_transactions": 150,
  "new_transactions": 25,
  "message": "Successfully synced 25 new transactions"
}
```

### Get Item Information
```http
POST /plaid/item
Content-Type: application/json

{
  "access_token": "access-sandbox-token"
}
```

**Response:**
```json
{
  "item": {
    "item_id": "item-sandbox-id",
    "institution_id": "ins_123",
    "webhook": "https://your-domain.com/api/webhooks/plaid"
  },
  "institution": {
    "institution_id": "ins_123",
    "name": "Chase Bank",
    "logo": "https://logo.url"
  }
}
```

### Get Categories
```http
GET /plaid/categories
```

**Response:**
```json
{
  "categories": [
    {
      "category_id": "10000000",
      "group": "special",
      "hierarchy": ["Bank Fees"],
      "category": "Bank Fees"
    }
  ]
}
```

## Google Sheets Management

### Initialize Spreadsheet
```http
POST /sheets/initialize
```

**Response:**
```json
{
  "message": "Spreadsheet initialized successfully"
}
```

### Get Transactions
```http
GET /sheets/transactions?page=1&limit=100&category=Food&start_date=2024-01-01&end_date=2024-12-31
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 100)
- `category` (string): Filter by category
- `start_date` (string): Filter by start date (YYYY-MM-DD)
- `end_date` (string): Filter by end date (YYYY-MM-DD)

**Response:**
```json
{
  "transactions": [
    {
      "transaction_id": "txn1",
      "account_id": "acc1",
      "account_name": "Checking Account",
      "institution_name": "Chase Bank",
      "date": "2024-01-15",
      "amount": -25.50,
      "currency": "USD",
      "merchant_name": "Starbucks",
      "category": "Food and Drink",
      "subcategory": "Restaurants",
      "user_category": "Coffee",
      "user_notes": "Morning coffee",
      "pending": false,
      "payment_channel": "online",
      "transaction_type": "place",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 150,
    "total_pages": 2
  }
}
```

### Get Transaction by ID
```http
GET /sheets/transactions/{transactionId}
```

**Response:**
```json
{
  "transaction": {
    "transaction_id": "txn1",
    "account_id": "acc1",
    "amount": -25.50,
    "merchant_name": "Starbucks",
    "user_category": "Coffee",
    "user_notes": "Morning coffee"
  }
}
```

### Update Transaction Category
```http
PUT /sheets/transactions/{transactionId}/category
Content-Type: application/json

{
  "user_category": "Coffee",
  "user_notes": "Morning coffee run"
}
```

**Response:**
```json
{
  "message": "Transaction category updated successfully",
  "transaction_id": "txn1",
  "user_category": "Coffee",
  "user_notes": "Morning coffee run"
}
```

### Get Categories
```http
GET /sheets/categories
```

**Response:**
```json
{
  "categories": ["Coffee", "Groceries", "Transportation", "Entertainment"]
}
```

### Get Statistics
```http
GET /sheets/statistics?start_date=2024-01-01&end_date=2024-12-31
```

**Response:**
```json
{
  "total_transactions": 150,
  "total_amount": 5000.00,
  "average_amount": 33.33,
  "category_breakdown": {
    "Coffee": 500.00,
    "Groceries": 2000.00,
    "Transportation": 1500.00
  },
  "monthly_breakdown": {
    "2024-01": 800.00,
    "2024-02": 750.00
  },
  "top_merchants": [
    {
      "merchant": "Starbucks",
      "amount": 500.00
    },
    {
      "merchant": "Whole Foods",
      "amount": 400.00
    }
  ]
}
```

### Search Transactions
```http
GET /sheets/search?query=starbucks&page=1&limit=50
```

**Query Parameters:**
- `query` (string, required): Search term
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 100)

**Response:**
```json
{
  "transactions": [
    {
      "transaction_id": "txn1",
      "merchant_name": "Starbucks",
      "amount": -25.50,
      "user_category": "Coffee"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "total_pages": 1
  },
  "query": "starbucks"
}
```

### Export to CSV
```http
GET /sheets/export?format=csv
```

**Response:** CSV file download

## Webhooks

### Plaid Webhook
```http
POST /webhooks/plaid
Content-Type: application/json

{
  "webhook_type": "TRANSACTIONS",
  "webhook_code": "DEFAULT_UPDATE",
  "item_id": "item-sandbox-id",
  "new_transactions": [
    {
      "transaction_id": "txn1",
      "account_id": "acc1",
      "amount": -25.50,
      "date": "2024-01-15",
      "merchant_name": "Starbucks"
    }
  ]
}
```

**Response:**
```json
{
  "status": "OK"
}
```

### Webhook Health Check
```http
GET /webhooks/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Webhook endpoint is healthy"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Error description",
    "stack": "Error stack trace (development only)"
  }
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate limited to 100 requests per 15 minutes per IP address.

## CORS

The API supports CORS with configurable origins via the `ALLOWED_ORIGINS` environment variable. 