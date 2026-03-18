# Deployment Guide

This guide covers deploying the Shaking Head News application to Vercel with optimal configuration for Hong Kong and Singapore regions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Vercel Configuration](#vercel-configuration)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Google OAuth Credentials**: Set up at [Google Cloud Console](https://console.cloud.google.com)
4. **Upstash Redis Database**: Create at [Vercel Marketplace](https://vercel.com/marketplace) or [Upstash Console](https://console.upstash.com)

## Environment Variables

### Required Variables

Set these in your Vercel project settings (Settings > Environment Variables):

```bash
# Auth.js Configuration
AUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Google OAuth
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-client-secret>

# Upstash Redis (Vercel Marketplace Storage)
UPSTASH_REDIS_REST_URL=<your-upstash-redis-rest-url>
UPSTASH_REDIS_REST_TOKEN=<your-upstash-redis-rest-token>

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEWS_API_BASE_URL=https://news.ravelloh.top

# Optional: server-managed Pro access
PRO_USER_IDS=<comma-separated-internal-user-ids>
PRO_USER_EMAILS=<comma-separated-user-emails>
```

### Generating AUTH_SECRET

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Copy the output and use it as your `AUTH_SECRET`.

Auth.js v5 also supports generating this secret with `npx auth secret`.

### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `https://your-domain.vercel.app/api/auth/callback/google`
     - `http://localhost:3000/api/auth/callback/google` (for local testing)
5. Copy the Client ID and Client Secret

### Setting Up Upstash Redis

#### Option 1: Via Vercel Marketplace (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to Storage tab
3. Click "Create Database"
4. Select "KV (Redis)" powered by Upstash
5. Choose a region (Hong Kong or Singapore recommended)
6. The environment variables will be automatically added to your project

Production deployments require Redis. The app will not fall back to in-memory storage outside development and test environments.

#### Option 2: Direct from Upstash

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Select region: Hong Kong or Singapore
4. Copy the REST URL and Token
5. Add them to your Vercel environment variables

## Vercel Configuration

The project includes a `vercel.json` file with optimal settings:

### Key Configurations

```json
{
  "framework": "nextjs",
  "functions": {
    "app/**/*.tsx": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

### Region Codes

**Note**: Region selection is only available on Vercel Pro plans and above.

- **Hobby Plan (Free)**: Automatically uses US regions (Washington DC, San Francisco)
- **Pro Plan**: Can specify regions like:
  - `hkg1`: Hong Kong
  - `sin1`: Singapore
  - `iad1`: Washington DC
  - `sfo1`: San Francisco

For Hobby accounts, Vercel automatically routes traffic to the nearest available US region.

## Deployment Steps

### 1. Connect Repository to Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js configuration

### 2. Configure Project Settings

1. **Framework Preset**: Next.js (auto-detected)
2. **Build Command**: `npm run build` (default)
3. **Output Directory**: `.next` (default)
4. **Install Command**: `npm install` (default)

### 3. Set Environment Variables

1. Go to Settings > Environment Variables
2. Add all required variables from the [Environment Variables](#environment-variables) section
3. Set variables for all environments (Production, Preview, Development)

### 4. Configure Regions (Pro Plan Only)

**Note**: Region configuration is only available on Vercel Pro plans.

- **Hobby Plan**: Automatically uses US regions (no configuration needed)
- **Pro Plan**: Can specify regions in `vercel.json` or project settings

### 5. Deploy

1. Click "Deploy"
2. Wait for the build to complete (typically 2-5 minutes)
3. Vercel will provide a deployment URL

### 6. Configure Custom Domain (Optional)

1. Go to Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL`
5. Update Google OAuth authorized redirect URIs

## Post-Deployment

### 1. Verify Deployment

Check these endpoints:

- **Homepage**: `https://your-domain.vercel.app/`
- **Login**: `https://your-domain.vercel.app/login`
- **Health Check**: Verify the app loads without errors

### 2. Test Authentication

1. Click "Sign in with Google"
2. Complete OAuth flow
3. Verify you're redirected back to the app
4. Check that settings are saved to Upstash Redis

### 3. Enable Analytics (Optional)

#### Vercel Analytics

1. Go to your project dashboard
2. Navigate to Analytics tab
3. Click "Enable Analytics"
4. No code changes needed

#### Vercel Speed Insights

1. Go to your project dashboard
2. Navigate to Speed Insights tab
3. Click "Enable Speed Insights"
4. No code changes needed

### 4. Monitor Performance

- **Vercel Dashboard**: Monitor deployments, analytics, and logs
- **Upstash Console**: Monitor Redis usage and performance
- **Google Cloud Console**: Monitor OAuth usage

## Troubleshooting

### Build Failures

**Issue**: Build fails with TypeScript errors

**Solution**:

```bash
# Run locally to identify issues
npm run type-check
npm run lint
```

**Issue**: Missing environment variables

**Solution**: Verify all required variables are set in Vercel project settings

### Authentication Issues

**Issue**: OAuth redirect fails

**Solution**:

1. Check Google OAuth authorized redirect URIs include:
   - `https://your-domain.vercel.app/api/auth/callback/google`
2. Ensure the request is reaching the expected deployment domain
3. Ensure `AUTH_SECRET` is set

**Issue**: "Invalid state" error

**Solution**: Clear browser cookies and try again

### Storage Issues

**Issue**: Settings not saving

**Solution**:

1. Verify Upstash Redis credentials are correct
2. Check Upstash Console for connection errors
3. Verify Redis database is in the correct region

**Issue**: "Connection refused" to Redis

**Solution**: Ensure you're using the REST URL and Token (not the Redis URL)

### Performance Issues

**Issue**: Slow page loads

**Solution**:

1. Check Vercel Analytics for bottlenecks
2. Verify ISR caching is working (check Network tab)
3. Consider enabling Vercel Edge Network

**Issue**: High function execution time

**Solution**:

1. Review function logs in Vercel Dashboard
2. Optimize Server Actions
3. Consider increasing function memory in `vercel.json`

### Image Loading Issues

**Issue**: Images not loading

**Solution**:

1. Verify image domains are whitelisted in `next.config.js`
2. Check browser console for CORS errors
3. Add missing domains to `remotePatterns` configuration

## Rollback Procedure

If a deployment causes issues:

1. Go to Vercel Dashboard > Deployments
2. Find the last working deployment
3. Click the three dots menu
4. Select "Promote to Production"
5. Confirm the rollback

## Continuous Deployment

Vercel automatically deploys:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Disable Auto-Deploy (if needed)

1. Go to Settings > Git
2. Toggle "Production Branch" or "Preview Branches"
3. Deploy manually from dashboard

## Security Checklist

Before going live:

- [ ] `AUTH_SECRET` is set and secure
- [ ] Google OAuth credentials are production-ready
- [ ] Upstash Redis is configured; production must not rely on in-memory storage
- [ ] All environment variables are set for production
- [ ] Custom domain has SSL certificate
- [ ] Security headers are configured (automatic via `next.config.js`)
- [ ] Rate limiting is enabled (automatic via `lib/rate-limit.ts`)
- [ ] Error monitoring is set up (optional)

## Monitoring and Maintenance

### Regular Checks

- **Weekly**: Review Vercel Analytics for traffic patterns
- **Weekly**: Check Upstash Redis usage and costs
- **Monthly**: Review and rotate secrets if needed
- **Monthly**: Update dependencies (`npm outdated`)

### Scaling Considerations

- **Traffic Spikes**: Vercel auto-scales, no action needed
- **Redis Limits**: Upgrade Upstash plan if approaching limits
- **Function Timeouts**: Increase `maxDuration` in `vercel.json` if needed

## Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Upstash Documentation**: [docs.upstash.com](https://docs.upstash.com)
- **Auth.js Documentation**: [authjs.dev](https://authjs.dev)

## Cost Estimation

### Vercel

- **Hobby Plan**: Free for personal projects
- **Pro Plan**: $20/month for production apps
- Includes: Unlimited bandwidth, 100GB-hours compute

### Upstash Redis

- **Free Tier**: 10,000 commands/day
- **Pay-as-you-go**: $0.2 per 100K commands
- Typical usage: ~1,000-5,000 commands/day for small apps

### Total Estimated Cost

- **Small App** (<1K users): $0-20/month
- **Medium App** (1K-10K users): $20-50/month
- **Large App** (>10K users): $50-200/month

---

**Last Updated**: 2026-03-18

For questions or issues, please open an issue on GitHub.
