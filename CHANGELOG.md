# Changelog

All notable changes to Shaking Head News will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2026.3.18] - 2026-03-18

### Added

- **Package Manager Standardization**: Migrated project workflows to `pnpm` with lockfile-based installs
- **Runtime Alignment**: Added Node.js version pinning for local/CI consistency (`24.x`)
- **Release Metadata**: Prepared first tagged release workflow with updated changelog and docs

### Changed

- **Linting Stack**: Upgraded to `eslint@10` and `@eslint/js@10`
- **CI Pipeline**: Updated GitHub Actions dependency install and cache strategy for `pnpm`
- **Docs Commands**: Updated setup/deploy/performance docs from `npm` commands to `pnpm` commands
- **Tech Stack Docs**: Synced documented versions for Next.js/React/TypeScript/ESLint with current project state

### Fixed

- **Auth Resilience**: Hardened OAuth session fallback when Redis persistence is temporarily unavailable
- **Tier Gating**: Restored Pro/Member feature boundary and one-click Pro activation flow
- **Vercel Routing Config**: Removed unstable function globs and moved route runtime controls to App Router exports
- **Encoding Cleanup**: Fixed UTF-8 content corruption in localization and docs updates

## [2.2.0] - 2026-01-26

### Added

- **Ad Settings**: Pro users can now toggle advertising banners in the settings page (persisted via localStorage)
- **Ad layout**: Implemented sticky, vertically centered sidebars for better ad visibility and user experience

### Changed

- **Rate Limiting**: Relaxed strict rate limits (Std: 300/min, Relaxed: 1000/min) to prevent false positives for active users
- **Layout**: Increased desktop layout spacing (gap-24) to improve visual separation between content and sidebars
- **Project Structure**: Renamed `proxy.ts` to `middleware.ts` within documentation (conceptual) but kept file as `proxy.ts` for Next.js 16 compatibility
- **Cleanup**: Removed redundant machine-specific configuration files and documentation

### Fixed

- **RSS Parsing**: Added strict type safety to V2EX RSS feed parsing to prevent `l.match` crashes
- **AdSense**: Fixed CSP errors and script loading issues by determining Pro status server-side
- **AdSense**: Fixed ad banners persisting after being disabled in settings by hydrating initial Pro status

### Removed

- Redundant duplicate configuration files (`*-CNSHNSLI01*`)

## [2.1.1] - 2026-01-13

### Changed

- **Repository Migration**: Migrated repository from `024812` to `ohengcom` organization
- **Pro Feature**: Pro status now stored in cloud database (Upstash Redis) instead of localStorage
- **Pro Unlock**: Added one-click Pro unlock button in settings for testing

### Fixed

- **Pro Status Sync**: Fixed Pro status not updating across all server components (Header, RSS page, Stats page)
- **BlurredStats**: Fixed stats page showing guest content for Pro users by passing server tier to component
- **SessionProvider**: Added SessionProvider to fix useSession hook errors

## [2.1.0] - 2025-12-01

### Changed

- **Tech Stack Upgrade**: Upgraded to Next.js 16.0.6, React 19.2.0, and Tailwind CSS 4.1.17
- **Rotation Enhancement**: Increased minimum rotation angle from 5-10 degrees to 8-25 degrees for improved shaking effect visibility
- **Configuration**: Removed deprecated `experimental.serverActions` config (now enabled by default in Next.js 16)

### Fixed

- **Next.js 16 Compatibility**: Updated `revalidateTag` calls to include required second parameter `{ expire: 0 }`
- **Build Configuration**: Removed ignored `memory` setting from `vercel.json`
- **Node Version**: Updated to Node.js 22.x for Vercel deployment consistency

## [2.0.0] - 2025-11-13

### Major Rewrite

Complete rewrite from Vue 3 browser extension to Next.js 15 web application.

### Added

- **Modern Tech Stack**: Next.js 16, React 19, TypeScript
- **User Authentication**: Google OAuth via NextAuth.js
- **Cloud Sync**: Settings sync via Upstash Redis
- **RSS Management**: Add, manage, and export custom RSS feeds
- **Statistics Dashboard**: Track rotation activity with charts
- **Health Reminders**: Browser notifications for neck health
- **Internationalization**: Full Chinese and English support
- **Theme Support**: Light, dark, and system theme modes
- **Responsive Design**: Mobile-first, works on all devices
- **Performance**: ISR caching, optimized images, code splitting
- **Security**: Rate limiting, input validation, CSP headers
- **Testing**: Unit tests (Vitest), E2E tests (Playwright)
- **CI/CD**: GitHub Actions workflow
- **Monitoring**: Logging and analytics integration

### Changed

- Migrated from browser extension to web application
- Replaced Pinia with Zustand for state management
- Replaced Vue Router with Next.js App Router
- Replaced Vite with Turbopack
- Improved UI with Tailwind CSS 4 and Shadcn/ui
- Enhanced accessibility features

### Removed

- Browser extension functionality (now web-only)
- Local-only storage (now supports cloud sync)

## [1.x.x] - Previous Versions

See the original [WAI project](https://github.com/dukeluo/wai) for version 1.x changelog.

---

## Credits

This project is based on the excellent [WAI](https://github.com/dukeluo/wai) project by [@dukeluo](https://github.com/dukeluo).
