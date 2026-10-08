# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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
