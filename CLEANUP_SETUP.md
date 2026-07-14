# Automatic Plan Cleanup Setup

This document explains how to set up automatic cleanup of expired plans (2+ days old).

## Overview

The cleanup endpoint removes plans that have been expired for more than 2 days. This prevents the database from growing indefinitely with stale plan records.

## Cleanup Endpoint

- **URL**: `POST /api/cleanup`
- **Authentication**: Optional `x-cron-secret` header verification
- **Returns**: JSON with deleted count and plan IDs

## Setup Options

### Option 1: EasyCron (Recommended for Render backend)

1. Go to [EasyCron.com](https://www.easycron.com/)
2. Sign up for a free account
3. Create a new cron job with these settings:
   - **URL**: `https://your-api-domain.com/api/cleanup`
   - **Method**: POST
   - **Schedule**: Daily at 00:00 UTC (or your preferred time)
   - **Headers**: Add header `x-cron-secret: YOUR_CRON_SECRET_VALUE`

### Option 2: Manual Curl Command

```bash
curl -X POST https://your-api-domain.com/api/cleanup \
  -H "x-cron-secret: YOUR_CRON_SECRET_VALUE"
```

### Option 3: Set Environment Variable

Add to Render environment variables:
- `CRON_SECRET`: Your secret key for verifying cron requests

## Security

The cleanup endpoint verifies the `x-cron-secret` header if `CRON_SECRET` environment variable is set. This prevents unauthorized cleanup requests.

## Verification

Check the backend logs to see cleanup activity:
- Look for log entries with "Error during cleanup" to see if cleanup ran
- The response includes `deletedCount` showing how many plans were removed

## Database Query

To manually check for plans eligible for cleanup:

```sql
SELECT id, user_id, expiry_date 
FROM user_plans 
WHERE expiry_date < NOW() - INTERVAL '2 days'
LIMIT 10;
```

## Troubleshooting

- **404 Error**: Cleanup route not registered - verify routes/index.ts includes cleanup router
- **401 Error**: Wrong or missing `x-cron-secret` header
- **No plans deleted**: All plans are either active or expired less than 2 days ago
