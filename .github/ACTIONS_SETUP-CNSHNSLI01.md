# GitHub Actions Setup Checklist

This checklist helps you configure the CI/CD pipeline for the Shaking Head News application.

## Prerequisites

- [ ] GitHub repository created
- [ ] Vercel account created
- [ ] Project deployed to Vercel at least once

## 1. Vercel Configuration

### Get Vercel Credentials

- [ ] **Vercel Token**
  - Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
  - Click "Create Token"
  - Name: `GitHub Actions CI/CD`
  - Scope: Full Account
  - Copy the token (you won't see it again!)

- [ ] **Vercel Organization ID**
  - Go to [Vercel Dashboard](https://vercel.com/dashboard)
  - Click on your organization/username
  - Go to Settings → General
  - Copy "Organization ID" or "Team ID"

- [ ] **Vercel Project ID**
  - Go to your project in Vercel
  - Go to Settings → General
  - Copy "Project ID"

### Alternative: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Get project info (shows IDs)
vercel project ls
```

## 2. GitHub Secrets Configuration

### Add Repository Secrets

Go to: `https://github.com/[YOUR_USERNAME]/[YOUR_REPO]/settings/secrets/actions`

- [ ] **VERCEL_TOKEN**
  - Click "New repository secret"
  - Name: `VERCEL_TOKEN`
  - Value: [Paste your Vercel token]
  - Click "Add secret"

- [ ] **VERCEL_ORG_ID**
  - Click "New repository secret"
  - Name: `VERCEL_ORG_ID`
  - Value: [Paste your Vercel org ID]
  - Click "Add secret"

- [ ] **VERCEL_PROJECT_ID**
  - Click "New repository secret"
  - Name: `VERCEL_PROJECT_ID`
  - Value: [Paste your Vercel project ID]
  - Click "Add secret"

### Optional: Codecov Token

- [ ] **CODECOV_TOKEN** (Optional but recommended)
  - Go to [Codecov](https://codecov.io/)
  - Sign in with GitHub
  - Add your repository
  - Copy the upload token
  - Add as GitHub secret: `CODECOV_TOKEN`

## 3. Vercel Environment Variables

Configure these in Vercel Dashboard → Settings → Environment Variables:

### Production Environment

- [ ] `AUTH_SECRET` (Generate: `openssl rand -base64 32`)
- [ ] `AUTH_GOOGLE_ID` (From Google Cloud Console)
- [ ] `AUTH_GOOGLE_SECRET` (From Google Cloud Console)
- [ ] `UPSTASH_REDIS_REST_URL` (From Upstash dashboard)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (From Upstash dashboard)
- [ ] `NEXT_PUBLIC_APP_URL` (Your app URL)
- [ ] `PRO_USER_IDS` / `PRO_USER_EMAILS` (Optional server-managed Pro allowlists)

### Preview Environment

- [ ] Same variables as Production (can use different values for testing)

### Development Environment

- [ ] Same variables as Production (can use different values for local dev)

## 4. Branch Protection Rules

Go to: `https://github.com/[YOUR_USERNAME]/[YOUR_REPO]/settings/branches`

### Protect `main` Branch

- [ ] Click "Add rule"
- [ ] Branch name pattern: `main`
- [ ] Enable the following:

#### Pull Request Requirements

- [ ] ✅ Require a pull request before merging
  - [ ] Require approvals: 1
  - [ ] Dismiss stale pull request approvals when new commits are pushed

#### Status Checks

- [ ] ✅ Require status checks to pass before merging
  - [ ] ✅ Require branches to be up to date before merging
  - [ ] Add required status checks:
    - [ ] `Lint & Format Check`
    - [ ] `TypeScript Type Check`
    - [ ] `Unit & Integration Tests`
    - [ ] `Build Application`

#### Additional Settings

- [ ] ✅ Require conversation resolution before merging
- [ ] ✅ Do not allow bypassing the above settings
- [ ] ✅ Restrict who can push to matching branches (optional)

- [ ] Click "Create" or "Save changes"

### Protect `develop` Branch (Optional)

- [ ] Repeat above steps for `develop` branch
- [ ] Can have less strict rules (e.g., no approval required)

## 5. Workflow Permissions

Go to: `https://github.com/[YOUR_USERNAME]/[YOUR_REPO]/settings/actions`

- [ ] **Workflow permissions**
  - [ ] Select "Read and write permissions"
  - [ ] ✅ Allow GitHub Actions to create and approve pull requests
  - [ ] Click "Save"

## 6. Test the Pipeline

### Create Test Branch

```bash
# Create and switch to test branch
git checkout -b test/ci-pipeline

# Make a small change
echo "<!-- CI/CD test -->" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify CI/CD pipeline"
git push origin test/ci-pipeline
```

### Create Pull Request

- [ ] Go to GitHub repository
- [ ] Click "Compare & pull request"
- [ ] Create PR from `test/ci-pipeline` to `develop` or `main`
- [ ] Watch the CI/CD pipeline run

### Verify Pipeline Steps

- [ ] ✅ Lint & Format Check passes
- [ ] ✅ TypeScript Type Check passes
- [ ] ✅ Unit & Integration Tests pass
- [ ] ✅ E2E Tests pass
- [ ] ✅ Build Application succeeds
- [ ] ✅ Security Audit completes
- [ ] ✅ Deploy Preview succeeds
- [ ] ✅ Preview URL commented on PR
- [ ] ✅ Lighthouse CI runs (if enabled)

### Verify Codecov (if configured)

- [ ] Coverage report appears in PR
- [ ] Coverage badge shows in PR checks
- [ ] Coverage diff shows for changed files

### Test Production Deployment

- [ ] Merge PR to `main`
- [ ] Verify production deployment triggers
- [ ] Check production URL is updated

## 7. Monitoring and Maintenance

### Regular Checks

- [ ] Monitor GitHub Actions usage (Settings → Billing)
- [ ] Review Codecov coverage trends
- [ ] Check Vercel deployment logs
- [ ] Review Lighthouse scores

### Monthly Tasks

- [ ] Review and update dependencies
- [ ] Check for security vulnerabilities
- [ ] Review CI/CD performance
- [ ] Update Node.js version if needed

### Security Updates

- [ ] Enable Dependabot alerts
- [ ] Review and merge Dependabot PRs
- [ ] Monitor security advisories

## 8. Troubleshooting

### Common Issues

#### Pipeline fails with "VERCEL_TOKEN not found"

- [ ] Verify secret is added correctly
- [ ] Check secret name matches exactly
- [ ] Regenerate token if expired

#### Build fails with environment variable errors

- [ ] Check Vercel environment variables
- [ ] Ensure all required variables are set
- [ ] Verify variable names match

#### E2E tests timeout

- [ ] Increase timeout in `playwright.config.ts`
- [ ] Check preview deployment is accessible
- [ ] Review Playwright logs in artifacts

#### Coverage upload fails

- [ ] Verify `CODECOV_TOKEN` is correct
- [ ] Check Codecov service status
- [ ] Review Codecov documentation

## 9. Documentation

- [ ] Read [CI/CD Setup Guide](.kiro/specs/tech-stack-upgrade/CI_CD_SETUP.md)
- [ ] Review [GitHub Actions Workflow](.github/workflows/ci.yml)
- [ ] Bookmark [Vercel Documentation](https://vercel.com/docs)
- [ ] Bookmark [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 10. Optional Enhancements

### Slack/Discord Notifications

- [ ] Add notification action to workflow
- [ ] Configure webhook URL
- [ ] Test notifications

### Automated Releases

- [ ] Set up semantic-release
- [ ] Configure release workflow
- [ ] Add CHANGELOG generation

### Performance Budgets

- [ ] Configure Lighthouse CI budgets
- [ ] Set performance thresholds
- [ ] Add budget checks to workflow

### Dependency Updates

- [ ] Enable Dependabot
- [ ] Configure auto-merge for minor updates
- [ ] Set up dependency review

## Completion

- [ ] All secrets configured
- [ ] Branch protection enabled
- [ ] Test pipeline successful
- [ ] Production deployment working
- [ ] Team members notified
- [ ] Documentation reviewed

---

## Quick Reference

### Useful Commands

```bash
# Run all checks locally
npm run lint
npm run type-check
npm run test
npm run build

# Run E2E tests
npm run test:e2e

# Check formatting
npm run format:check

# Fix formatting
npm run format
```

### Useful Links

- [GitHub Actions Logs](https://github.com/[YOUR_USERNAME]/[YOUR_REPO]/actions)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Codecov Dashboard](https://codecov.io/gh/[YOUR_USERNAME]/[YOUR_REPO])
- [Repository Settings](https://github.com/[YOUR_USERNAME]/[YOUR_REPO]/settings)

---

**Last Updated**: 2025-01-13
**Version**: 1.0.0
