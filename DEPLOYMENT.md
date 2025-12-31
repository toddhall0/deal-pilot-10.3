# Deal Pilot 10.3 - Production Deployment Guide

## Prerequisites

- Railway account with PostgreSQL database provisioned
- Cloudflare R2 or AWS S3 bucket configured
- Anthropic API key
- Resend API key (optional, for emails)
- GitHub repository connected to Railway

## Environment Variables

Set these in Railway:

### Required
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
S3_ENDPOINT=https://your-account.r2.cloudflarestorage.com
ANTHROPIC_API_KEY=sk-ant-...
```

### Optional
```
RESEND_API_KEY=re_...
CRON_SECRET=your-cron-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Deployment Steps

### 1. Database Setup
```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Build Verification
```bash
# Local build test
npm run build

# Check for TypeScript errors
npm run lint
```

### 3. Railway Deployment

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will auto-deploy on push to main branch

### 4. Post-Deployment Checks

1. Visit /api/health to verify API is running
2. Visit /admin/checklist to run system checks
3. Test login functionality
4. Test file upload
5. Test AI contract analysis

### 5. Set Up Cron Jobs

For automated reminders, set up a cron job to call:
```
GET https://your-domain.com/api/cron/reminders
Authorization: Bearer your-cron-secret
```

Recommended: Daily at 8 AM

## Monitoring

### Health Endpoints
- `/api/health` - Overall health check
- `/api/health/db` - Database connection
- `/api/health/storage` - File storage
- `/api/health/ai` - AI service
- `/api/health/email` - Email service

### Logs
Monitor Railway logs for errors and performance issues.

## Rollback

If issues occur:
1. Railway dashboard > Deployments
2. Click on previous successful deployment
3. Click "Rollback"

## Security Checklist

- [ ] NEXTAUTH_SECRET is unique and secure
- [ ] Database is not publicly accessible
- [ ] S3/R2 bucket is private
- [ ] API keys are not committed to git
- [ ] HTTPS is enabled
- [ ] CORS is properly configured

## Performance Optimization

1. Enable Railway's auto-scaling
2. Set up Redis for session storage (optional)
3. Enable CDN for static assets
4. Monitor database query performance

---

## Final Pre-Deployment Tests

Run these locally before deploying:

1. `npm run build` - Ensure no build errors
2. `npm run start` - Test production build locally
3. Test all major features:
   - User authentication
   - Deal creation and editing
   - Document upload
   - AI contract analysis
   - Timeline and milestones
   - Reports export
   - Notifications
   - Search functionality

## Deploy to Production

Push to GitHub for deployment:
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

Monitor Railway deployment logs and verify all services are running.
