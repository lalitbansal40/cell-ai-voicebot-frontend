# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Phase 2 · T2.18 — E2E + sign-off** — 2026-10-08
  - Playwright 1.64 (`e2e/`, Chromium): sign-up → code → dashboard; invite manager → menu by role → viewer → disabled; suspend / enable; forgot → reset (other sessions end) → change password; impersonation. Isolated backend DB (`cav_e2e`) + Redis db 5, codes / links from Mailpit. Manual CI workflow `e2e.yml`.
  - Fixed: sidebar covered the left of every page (≥ md); timezones shown / sent by current IANA name (`Asia/Kolkata`).
  - Coverage gate: functions 80 → 85. gitleaks allowlists the test-only passphrases.

- **Phase 2 · T2.17 — Superadmin** — 2026-10-08
  - `/admin/accounts` (search, status filter, pagination) and `/admin/accounts/:id` (overview, users by status, recent activity, Rates placeholder for Phase 4), suspend with reason, enable, impersonate the owner (confirm → dashboard with banner → Stop returns to the account page).

- **Phase 2 · T2.16 — Team + Settings** — 2026-10-08
  - Team: table with search / status filter, invite dialog, resend / revoke, role changes, enable / disable, remove, ownership transfer — actions by permission.
  - Settings tabs: Profile, Security (change password, sessions, sign out everywhere), Account (timezone, language, calling window, recording / AI disclosure; read-only without `account.update` or when suspended), API keys (scopes, key shown once with copy), Audit log (filters, load more, account timezone).

- **Phase 2 · T2.13–T2.15 — Auth + app shell** — 2026-10-08
  - In-memory session store, refresh on 401 (single flight across tabs via Web Locks), `AuthBootstrap`, route guards, realtime on while signed in (`session.revoked`, `user.updated`, account events).
  - Pages: login, signup, email code (6 boxes, paste, resend countdown), forgot / reset password, accept invite; 403, error page, dashboard skeleton.
  - App shell: permission-aware sidebar, header (account, live-updates dot, theme toggle, user menu), suspended / impersonation banners; shared `ConfirmProvider`, `PageHeader`, `DataTable`, `EmptyState`, `StatusChip`, `CopyButton`, `RelativeTime`.
  - Tests: 85 → 187.

- **Phase 1 · T1.15** — 2026-10-08
  - API types regenerated (`/health`, `/ready`).
  - `ApiError` + `toApiError` (error envelope, network, timeout, canceled, unknown), `getErrorMessage`, `applyFieldErrors` for react-hook-form; axios interceptor + `unwrap()`.
  - React Query error policy: no retry on 4xx, max 2 retries for network / timeout / 5xx, mutations never retry; global toast for unexpected errors (`meta.silent` opt-out, short request reference).
  - Realtime: `RealtimeClient` (ticket per connection, 25 s ping, full-jitter backoff ≤ 30 s, close-code handling, ref-counted topics, dedupe, refetch after reconnect), `RealtimeProvider` (off until Phase 2) and hooks `useWsStatus` / `useWsEvent` / `useWsTopic`.
  - DEV-only `/dev/realtime` page (not in production builds).
  - Home page API status card (`SystemInfoCard`).
  - Tests: 7 → 81.

- **Phase 1 · T1.16** — 2026-10-08
  - Tests for the provider wiring (global toast, realtime off until Phase 2) and the full `App`.
  - Coverage gate (statements 90 · branches 85 · functions 80 · lines 90) in `vite.config.ts`; CI runs `npm run test:coverage`.
  - Tests: 81 → 85.

- **Phase 0** — 2026-10-08
  - Vite 8 + React 19 + MUI 9 + React Router 8 + React Query + notistack scaffold, ESLint 9 / Prettier / Husky / commitlint, Vitest + RTL, generated API types from the backend OpenAPI spec (`npm run gen:api`), GitHub Actions CI.
