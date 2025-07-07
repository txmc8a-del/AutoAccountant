# AutoAccountant Deployment Guide

## Overview

This guide covers deploying AutoAccountant to various hosting platforms. The application is a Node.js API server that integrates with Plaid and Google Sheets.

## Prerequisites

Before deploying, ensure you have:

1. **Plaid Account**: Set up with appropriate environment (sandbox/development/production)
2. **Google Cloud Project**: With Google Sheets API enabled
3. **Google Service Account**: With Sheets permissions
4. **Domain/Subdomain**: For webhook endpoints (required for Plaid)

## Environment Variables

Set these environment variables in your hosting platform:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Plaid Configuration
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=development  # or production
PLAID_WEBHOOK_URL=https://yourdomain.com/api/webhooks/plaid

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=path/to/service-account-key.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_google_sheets_spreadsheet_id

# Notification Configuration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
```

## Deployment Options

### 1. Vercel (Recommended for Easy Setup)

Vercel provides easy deployment with serverless functions.

#### Setup Steps:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Create vercel.json**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/server.js"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add PLAID_CLIENT_ID
   vercel env add PLAID_SECRET
   # ... add all other environment variables
   ```

5. **Update Google Service Account**:
   - Upload your service account JSON to Vercel
   - Update the path in environment variables

### 2. Railway

Railway provides simple Node.js deployment.

#### Setup Steps:

1. **Connect Repository**:
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository

2. **Configure Environment**:
   - Add all environment variables in Railway dashboard
   - Upload Google service account JSON file

3. **Deploy**:
   - Railway automatically deploys on git push

### 3. Heroku

Heroku provides traditional hosting with add-ons.

#### Setup Steps:

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**:
   ```bash
   heroku create your-autoaccountant-app
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PLAID_CLIENT_ID=your_plaid_client_id
   heroku config:set PLAID_SECRET=your_plaid_secret
   # ... set all other variables
   ```

4. **Upload Google Service Account**:
   ```bash
   heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY="$(cat path/to/service-account.json)"
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

### 4. AWS (EC2)

For full control and scalability.

#### Setup Steps:

1. **Launch EC2 Instance**:
   - Use Ubuntu 20.04 LTS
   - Configure security groups for port 3000

2. **Install Dependencies**:
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx
   ```

3. **Deploy Application**:
   ```bash
   git clone your-repo
   cd AutoAccountant
   npm install
   npm run build
   ```

4. **Setup PM2**:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name autoaccountant
   pm2 startup
   pm2 save
   ```

5. **Configure Nginx**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Setup SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

### 5. Google Cloud Platform (App Engine)

For Google Cloud integration.

#### Setup Steps:

1. **Create app.yaml**:
   ```yaml
   runtime: nodejs18
   env: standard
   
   env_variables:
     NODE_ENV: production
     PLAID_CLIENT_ID: your_plaid_client_id
     PLAID_SECRET: your_plaid_secret
     # ... other environment variables
   
   handlers:
     - url: /.*
       script: auto
   ```

2. **Deploy**:
   ```bash
   gcloud app deploy
   ```

## Post-Deployment Setup

### 1. Initialize Google Sheets

After deployment, initialize your spreadsheet:

```bash
curl -X POST https://yourdomain.com/api/sheets/initialize
```

### 2. Test Webhook Endpoint

Test that your webhook endpoint is accessible:

```bash
curl -X GET https://yourdomain.com/api/webhooks/health
```

### 3. Configure Plaid Webhook

In your Plaid dashboard:
1. Go to your app settings
2. Set webhook URL to: `https://yourdomain.com/api/webhooks/plaid`
3. Test the webhook

### 4. Test Notifications

Test your notification setup:

```bash
curl -X POST https://yourdomain.com/api/test-notification
```

## Monitoring and Maintenance

### 1. Logs

Monitor application logs:
- **Vercel**: `vercel logs`
- **Railway**: Dashboard logs
- **Heroku**: `heroku logs --tail`
- **AWS**: CloudWatch logs
- **GCP**: App Engine logs

### 2. Health Checks

Set up health check monitoring:

```bash
curl https://yourdomain.com/health
```

### 3. Database Backup

Google Sheets data is automatically backed up, but consider:
- Regular exports to CSV
- Setting up Google Drive backup
- Monitoring API quotas

### 4. Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Rate Limiting**: Already configured in the app
3. **CORS**: Configure `ALLOWED_ORIGINS` properly
4. **Environment Variables**: Never commit secrets to git
5. **API Keys**: Rotate keys regularly

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Data**:
   - Check webhook URL is accessible
   - Verify HTTPS is enabled
   - Check Plaid webhook configuration

2. **Google Sheets Permission Errors**:
   - Verify service account has edit permissions
   - Check service account JSON is valid
   - Ensure Google Sheets API is enabled

3. **Plaid API Errors**:
   - Check environment variables
   - Verify Plaid environment (sandbox/development/production)
   - Check API rate limits

4. **Application Crashes**:
   - Check logs for error details
   - Verify all environment variables are set
   - Check Node.js version compatibility

### Support

For deployment issues:
1. Check the application logs
2. Verify environment variables
3. Test endpoints individually
4. Review the API documentation
5. Create an issue on GitHub

## Cost Optimization

### Free Tiers
- **Vercel**: Generous free tier for personal use
- **Railway**: Free tier available
- **Heroku**: Free tier discontinued, paid plans start at $7/month
- **AWS**: Free tier for 12 months
- **GCP**: Free tier available

### Scaling Considerations
- **Vercel**: Automatic scaling with serverless
- **Railway**: Manual scaling
- **Heroku**: Add-ons for scaling
- **AWS**: Full control over scaling
- **GCP**: Automatic scaling with App Engine

Choose the platform that best fits your budget and technical requirements. 