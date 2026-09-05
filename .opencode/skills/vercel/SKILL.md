---
name: vercel
description: Manage and monitor Vercel projects, trigger builds, inspect deployments, view build logs, and manage environment variables using Vercel CLI and API. Use when inspecting, deploying, or troubleshooting Vercel deployments.
---

# Vercel Deployment & Management Skill

This skill provides procedures and commands for deploying and monitoring Next.js projects on Vercel.

## Quick CLI Reference

Vercel CLI commands run through `npx vercel` or `vercel`:

- **Check Current Login / User**:

  ```powershell
  npx vercel whoami
  ```

- **Inspect Deployment Details & Build Logs**:

  ```powershell
  npx vercel inspect <deployment-id-or-url> --logs
  ```

- **List Recent Deployments**:

  ```powershell
  npx vercel ls
  ```

- **Deploy Preview**:

  ```powershell
  npx vercel
  ```

- **Deploy Production**:

  ```powershell
  npx vercel --prod
  ```

- **Pull Environment Variables**:
  ```powershell
  npx vercel env pull .env.local
  ```

## Troubleshooting Deployment Failures

1. **Inspect Logs**: Run `npx vercel inspect <deployment-url> --logs` to find exact build errors.
2. **Package Manager Alignment**: Ensure `packageManager` in `package.json` aligns with supported Corepack/pnpm versions on Vercel.
3. **Node Engine**: Vercel reads `engines.node` in `package.json`. Make sure the Node version matches project settings.
4. **Environment Variables**: Ensure production environment variables (e.g., Redis, NextAuth, OAuth secrets) are populated in the Vercel Project Dashboard.
