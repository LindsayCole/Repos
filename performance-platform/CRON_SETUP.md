# Review Cycle Automation - Cron Job Setup

This document explains how to set up and use the automated review cycle scheduling feature.

## Overview

The Performance Platform includes an automated scheduling system that checks for due review cycles daily and launches them automatically. This eliminates the need for manual review creation and ensures timely performance reviews.

## How It Works

1. **Review Cycles**: HR creates review cycles with a frequency (monthly, quarterly, semi-annual, or annual)
2. **Automated Checking**: A cron job runs daily at 9:00 AM UTC
3. **Automatic Launch**: Any cycle with a `nextRunDate` in the past is automatically launched
4. **Bulk Review Creation**: Reviews are created for all target employees
5. **Email Notifications**: All affected employees receive email notifications
6. **Next Run Calculation**: The cycle's `nextRunDate` is automatically updated

## Configuration

### 1. Vercel Cron (Production - Recommended)

The application includes a `vercel.json` file that configures Vercel Cron:

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule**: `0 9 * * *` = Every day at 9:00 AM UTC

#### Setup Steps:

1. **Set Environment Variable** in Vercel Dashboard:
   ```
   CRON_SECRET=<generate-random-string>
   ```
   Generate a secure random string:
   ```bash
   openssl rand -base64 32
   ```

2. **Deploy to Vercel**: The cron job is automatically configured on deployment

3. **Verify**: Check Vercel Dashboard → Cron Jobs to see execution logs

### 2. Alternative Cron Services

If not using Vercel, you can use any cron service to call the endpoint:

**Endpoint**: `https://your-domain.com/api/cron`

**Method**: GET

**Headers**:
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Examples**:

#### EasyCron
1. Create account at easycron.com
2. Add new cron job with URL: `https://your-domain.com/api/cron`
3. Schedule: `0 9 * * *` (daily at 9 AM)
4. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

#### cron-job.org
1. Create account at cron-job.org
2. Add new job with your API endpoint
3. Set schedule and add authorization header

#### Self-Hosted (Linux)
Add to crontab:
```bash
0 9 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron
```

### 3. Development/Testing

For local development, you can manually trigger the cron job:

#### Method 1: GET Request
```bash
curl http://localhost:3000/api/cron
```

#### Method 2: POST Request (Manual Trigger)
```bash
curl -X POST http://localhost:3000/api/cron
```

**Note**: In development mode, authentication is skipped for easier testing.

## Monitoring

### Check Execution Logs

**Vercel**:
- Go to Vercel Dashboard → Your Project → Cron Jobs
- View execution history and logs

**API Response**:
```json
{
  "success": true,
  "message": "Review cycles processed successfully",
  "processedAt": "2025-01-15T09:00:00.000Z",
  "cyclesProcessed": 2,
  "results": [
    {
      "cycleId": "abc123",
      "cycleName": "Q1 2025 Reviews",
      "reviewsCreated": 25,
      "nextRunDate": "2025-04-01T00:00:00.000Z",
      "success": true
    }
  ]
}
```

### Application Logs

The scheduler outputs detailed logs:
```
[Review Scheduler] Checking for due cycles at 2025-01-15T09:00:00.000Z
[Review Scheduler] Found 2 due cycles
[Review Scheduler] Processing cycle: Q1 2025 Reviews (abc123)
[Review Scheduler] Creating reviews for 25 users
[Review Scheduler] Successfully processed cycle Q1 2025 Reviews: 25 reviews created
[Review Scheduler] Completed processing 2 cycles
```

## Customizing the Schedule

Edit `vercel.json` to change the schedule:

**Examples**:

```json
// Every day at midnight UTC
"schedule": "0 0 * * *"

// Every Monday at 8 AM UTC
"schedule": "0 8 * * 1"

// Every 1st and 15th of the month at 9 AM UTC
"schedule": "0 9 1,15 * *"

// Every 6 hours
"schedule": "0 */6 * * *"
```

Cron format: `minute hour day month weekday`

## Security

### Production Security

1. **Always set CRON_SECRET** in production
2. **Use a strong random string** (32+ characters)
3. **Don't commit secrets** to version control
4. **Rotate secrets periodically**

### Authentication Flow

- **Production**: Requires `Authorization: Bearer CRON_SECRET` header
- **Development**: Authentication skipped for easier testing

## Troubleshooting

### Issue: Cron job not running

**Check**:
1. Verify `vercel.json` is deployed
2. Check Vercel Dashboard → Cron Jobs for errors
3. Verify `CRON_SECRET` is set in Vercel environment variables
4. Check application logs for errors

### Issue: Reviews not being created

**Check**:
1. Verify cycles have `isActive = true`
2. Check `nextRunDate` is in the past
3. Verify target users have managers assigned
4. Check application logs for specific errors

### Issue: 401 Unauthorized

**Fix**: Set `CRON_SECRET` environment variable in Vercel Dashboard

### Manual Test

To manually test a cycle without waiting for cron:
1. Go to `/cycles/[id]` in the application
2. Click "Launch Cycle" button
3. This immediately creates reviews without updating `nextRunDate`

## Best Practices

1. **Test First**: Create a test cycle with `includeAllUsers = false` and specific departments
2. **Monitor Logs**: Check execution logs after first run
3. **Set Up Alerts**: Use Vercel notifications or monitoring tools
4. **Review Timing**: Schedule cron at off-peak hours
5. **Email Limits**: Be aware of email service rate limits for large organizations

## Environment Variables Summary

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="<random-string>"
NEXTAUTH_URL="https://your-domain.com"
RESEND_API_KEY="<your-resend-key>"
CRON_SECRET="<random-string>"  # Required for production
```

## Additional Resources

- [Vercel Cron Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Resend API Documentation](https://resend.com/docs)
