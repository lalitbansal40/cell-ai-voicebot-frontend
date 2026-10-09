# Cell AI Voicebot — Frontend

Dashboard for the multi-tenant AI voice calling platform (React 19 + TypeScript + Vite + MUI).

## Status

Phase 3 — contacts: table with search / filters / bulk actions, contact detail, CSV / XLSX import wizard, lists, segments (builder), do-not-call, custom fields, CSV export, imports & exports history. Phase 2 (auth, accounts, RBAC, app shell, team, settings, superadmin) underneath. Playwright E2E. Changes: [CHANGELOG.md](CHANGELOG.md).

## Prerequisites

- **Node.js 24 LTS** (`.nvmrc` = `24`; `engine-strict=true` blocks other versions)
- **npm ≥ 10**
- Backend API running on `http://localhost:5100` — the dev server proxies `/api` and `/ws` to it.

## Getting started

```bash
npm ci        # install exact dependencies from the lockfile
npm run dev   # http://localhost:3100
```

With the backend running (`npm run infra:up && npm run db:migrate && npm run dev` in `cell-ai-voicebot-backend`), open <http://localhost:3100>, choose **Create an account**, and enter the 6-digit code from Mailpit (<http://localhost:8025>). Seeded demo users: `npm run db:seed` in the backend. Superadmin: `npm run superadmin:create -- you@example.com` in the backend, then sign in → **Accounts** in the menu. Swagger UI is also reachable through the proxy at <http://localhost:3100/api/docs>.

## Authentication & permissions

- The access token lives **in memory only** (Zustand store); the refresh token is an `HttpOnly` cookie. On load `AuthBootstrap` refreshes the session; a reload keeps you signed in.
- One refresh at a time across tabs (Web Locks); a request that fails with `401` is retried once after a refresh. A failed refresh signs out and returns to `/login?next=…`.
- Routes: `RequireAuth`, `RedirectIfAuthed`, `RequirePermission perm="…"` (→ `/403`), `RequirePlatformAdmin`. Menu items declare their permission and hide without it; items of later phases stay hidden (`LIVE_PHASE` in `src/layout/nav-config.ts`).
- **Impersonation** (superadmin → account owner, 30 min) keeps the admin session aside; the banner's **Stop** returns to it. The impersonation token is memory-only, so a full page reload also returns to the admin session.
- Live updates: the header dot shows the WebSocket state; role / account changes refresh the session, `session.revoked` signs out.

## Contacts

- `/contacts/:tab` — **Contacts** (search, list / tag / DND / opted-out / segment filters, **Advanced filter** = the segment builder, kept in the URL as `?f=…` and savable as a segment; column picker per user; bulk actions by selection or "all matching"; Export), **Lists**, **Segments** (builder with operators per field type and a live count), **Do-not-call** (only `dnd.manage` removes numbers), **Fields** (reorder, key never changes, type locked once used).
- `/contacts/c/:id` — detail with typed variables (₹ amounts from micros, dates never shifted by a timezone), tags / lists, opt-out, DND, delete.
- `/contacts/import` (`?kind=dnd` for do-not-call files) → upload → mapping (suggested, new fields inline, date format, sheet) → options → check (totals, problem rows, error report) → import with live progress (WebSocket, polling every 3 s when offline) → summary. `/contacts/import/:jobId` resumes any step.
- `/contacts/activity` — imports and exports history (exports kept 24 h; downloads always fetch a fresh signed link). Exports are hidden while impersonating.
- Try it with the backend sample sheets in `../cell-ai-voicebot-backend/docs/samples` (expected totals in their README).

## API errors & realtime

- **Errors:** every failed request rejects with an `ApiError` (`status`, `code`, `message`, `details`, `requestId`, `kind`). Client-only codes `NETWORK_ERROR`, `TIMEOUT`, `REQUEST_CANCELED`, `UNKNOWN_ERROR` are documented in the backend [error codes](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/error-codes.md).
- **React Query:** queries retry network / timeout / 5xx only (max 2); mutations never retry; unexpected errors show a toast with a short request reference.
- **Realtime:** `RealtimeProvider` + hooks (`useWsStatus`, `useWsEvent`, `useWsTopic`) — see [websocket.md §11](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/websocket.md). On while signed in (ticket from `POST /api/v1/ws/tickets`).
- **DEV tool `/dev/realtime`:** in the backend run `npm run ws:dev-ticket`, change the port in the printed URL to `3100` (Vite proxy), paste it on <http://localhost:3100/dev/realtime>, click Connect, then publish a test event (e.g. `docker exec cav-redis redis-cli PUBLISH ws:fanout '{"target":{"accountId":"dev-account"},"event":{"id":"evt_1","type":"wallet.updated","ts":"2026-10-08T00:00:00Z","data":{"balanceMicros":1}}}'`). Tickets are single use — paste a new one to reconnect. Not included in production builds.

## Ports

| What                            | Port |
| ------------------------------- | ---- |
| Vite dev server                 | 3100 |
| `vite preview`                  | 3101 |
| Proxy `/api` → backend API      | 5100 |
| Proxy `/ws` → backend WebSocket | 5100 |

## Scripts

| Script                  | What it does                                       |
| ----------------------- | -------------------------------------------------- |
| `npm run dev`           | Vite dev server with HMR on port 3100              |
| `npm run build`         | Type-check (`tsc -b`) and build to `dist/`         |
| `npm run preview`       | Serve the production build on port 3101            |
| `npm run typecheck`     | Type-check all TS projects                         |
| `npm run lint`          | ESLint (type-aware), fails on any warning          |
| `npm run lint:fix`      | ESLint with auto-fix                               |
| `npm run format`        | Prettier write                                     |
| `npm run format:check`  | Prettier check                                     |
| `npm test`              | Run all tests once (Vitest + jsdom)                |
| `npm run test:watch`    | Vitest watch mode                                  |
| `npm run test:coverage` | Tests + coverage report in `coverage/`             |
| `npm run gen:api`       | Regenerate API types from the backend OpenAPI spec |
| `npm run e2e`           | Playwright E2E (starts backend + frontend)         |
| `npm run e2e:report`    | Open the last Playwright HTML report               |

## Folder structure

See [src/README.md](src/README.md). Key stack: React Router (data router), React Query, MUI (light + dark color schemes), notistack, axios, zod, react-hook-form.

## API types

Request/response types are generated from the backend OpenAPI spec ([ADR 0029](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/adr/0029-shared-api-types-via-openapi.md)) — never hand-written.

1. In the backend repo: `npm run gen:openapi` (updates `openapi/openapi.json`).
2. Here: `npm run gen:api` → regenerates `src/services/api/schema.gen.ts` (committed; do not edit).
   - Default spec path: `../cell-ai-voicebot-backend/openapi/openapi.json`; override with `OPENAPI_SPEC=/path/to/openapi.json npm run gen:api`.
3. Use friendly aliases from `src/services/api/types.ts` (e.g. `AppInfo`, `ApiErrorEnvelope`).

`openapi-typescript` officially declares `typescript ^5`; `package.json` → `overrides` makes it use the project's TypeScript 6 (verified working — see ADR 0029).

## Testing

- **Runner:** Vitest with `jsdom` + React Testing Library (`@testing-library/jest-dom` matchers, `user-event`).
- Tests live next to the code: `src/**/*.test.tsx`.
- `src/test/setup.ts` registers matchers and cleans up after each test.
- `src/test/render.tsx` → `renderWithProviders({ route, routes, queryClient })` renders the real app routes with theme + React Query (retries off) + notistack on a memory router.
- `src/test/fake-websocket.ts` → `FakeWebSocket` for realtime tests (no extra test dependencies; HTTP fakes use an axios `adapter`).
- `src/test/realtime.ts` → `fakeRealtime()` gives a client to pass as `renderWithProviders({ realtime })` and an `emit(type, data)` to push events.
- `src/test/auth.ts` → `signInAs(role)`, `fakeSession(role)` (role permissions mirror the backend system roles); tests start signed out.
- **Coverage gate:** `npm run test:coverage` enforces thresholds in `vite.config.ts` (statements 95 · branches 90 · functions 90 · lines 95 — Phase 3 sign-off values rounded down). CI runs it.

### End-to-end (Playwright)

`e2e/` — Chromium against the **real backend** (sibling folder `../cell-ai-voicebot-backend`) and Mailpit:

1. In the backend: `npm run infra:up` (MongoDB, Redis, Mailpit). Ports 5100 and 3100 must be free — stop your dev servers (if something else holds 3100: `E2E_FRONTEND_PORT=3150 npm run e2e`).
2. Once: `npx playwright install chromium`.
3. `npm run e2e` — Playwright starts the backend with an **isolated database `cav_e2e` and Redis db 5** (wiped, migrated and given a test superadmin on every run by `e2e/prepare-backend.mjs`; your dev data is untouched) plus the Vite dev server, and reads codes / links from the Mailpit API.

Scenarios: sign-up → code → dashboard → sign-out / sign-in; owner invites a manager → menu and pages follow the role → viewer → disabled; superadmin suspends / enables; forgot → reset (other sessions end, link single-use) → change password; impersonation start / blocked actions / stop; **contacts** — the 100-row sample CSV with a required field, existing contacts and DND numbers (exact totals, error report CSV, typed values on the contact page), XLSX with a sheet switch, segment "DPD > 30" → bulk tag → CSV export (BOM, formula escaping), do-not-call roles (manager adds, owner removes, opt-out survives a re-import), agent read-only. The contacts specs read `../cell-ai-voicebot-backend/docs/samples`. `E2E_BACKEND_LOGS=1 npm run e2e` prints backend logs (used for the secrets-in-logs check). In CI: the manual **E2E** workflow (`.github/workflows/e2e.yml`).

## Code quality

- ESLint (type-aware `typescript-eslint`, `import-x`, `react-hooks`, `react-refresh`) + Prettier.
- Husky hooks: `pre-commit` → lint-staged; `commit-msg` → commitlint (Conventional Commits).
- npm 11 install-script approvals live in `package.json` → `allowScripts` (`unrs-resolver: true`, `fsevents: false`). Review new ones with `npm approve-scripts --allow-scripts-pending`.

## CI

<!-- CI badge: add after the first run — see https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/setup/github-settings.md -->

GitHub Actions (`.github/workflows/ci.yml`) on every pull request and on pushes to `main` / `dev`:

- **verify** — `npm ci`, lint, format check, typecheck, tests **with the coverage gate**, build (Node from `.nvmrc`).
- **secrets-scan** — gitleaks over the full git history (`.gitleaks.toml`).
- **audit** — `npm audit --audit-level=high` (informational, non-blocking).
- **commitlint** — checks every commit message in a PR.

`.github/workflows/e2e.yml` (**manual**, `workflow_dispatch`) checks out the backend next to this repo and runs the Playwright suite; needs a `BACKEND_REPO_TOKEN` secret while the backend repo is private.

Run the same checks locally: `npm run lint && npm run format:check && npm run typecheck && npm run test:coverage && npm run build`.
Dependabot (`.github/dependabot.yml`) opens weekly grouped update PRs. Repo settings to apply by hand: [GitHub settings](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/setup/github-settings.md).

## Environment variables

Copy `.env.example` → `.env.local` (gitignored). **Every `VITE_*` variable is public** — it is compiled into the browser bundle, so never put a secret here. Policy: [secrets.md](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/secrets.md).

| Variable        | Required                          | Description                                                                               |
| --------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `VITE_API_URL`  | no (default `/api/v1`)            | API base URL; default uses the dev proxy to `:5100`                                       |
| `VITE_WS_URL`   | no (default: page origin + `/ws`) | WebSocket **base** URL (`ws://localhost:3100/ws` via proxy); the client appends `/events` |
| `VITE_APP_NAME` | no                                | Display name of the app                                                                   |

## Docs

All project docs (plans, ADRs, conventions) live in the **backend repo** `docs/` folder:
<https://github.com/lalitbansal40/cell-ai-voicebot-backend/tree/main/docs> (locally: `../cell-ai-voicebot-backend/docs/`).

## Conventions

- [Definition of Done](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/definition-of-done.md)
- [Architecture Decision Records](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/adr/README.md)
- [API conventions](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/api.md) · [Error codes](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/error-codes.md) · [WebSocket](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/websocket.md) · [Data](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/data.md) · [Code style](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/code-style.md)
