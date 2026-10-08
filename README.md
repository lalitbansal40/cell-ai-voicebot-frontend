# Cell AI Voicebot — Frontend

Dashboard for the multi-tenant AI voice calling platform (React 19 + TypeScript + Vite + MUI).

## Status

Phase 1 — foundation: typed API errors, React Query error policy, realtime (`/ws/events`) client, API status card. Changes: [CHANGELOG.md](CHANGELOG.md).

## Prerequisites

- **Node.js 24 LTS** (`.nvmrc` = `24`; `engine-strict=true` blocks other versions)
- **npm ≥ 10**
- Backend API running on `http://localhost:5100` (from Phase 1) — the dev server proxies `/api` and `/ws` to it.

## Getting started

```bash
npm ci        # install exact dependencies from the lockfile
npm run dev   # http://localhost:3100
```

With the backend running (`npm run infra:up && npm run dev` in `cell-ai-voicebot-backend`) the home page shows the API status card; Swagger UI is also reachable through the proxy at <http://localhost:3100/api/docs>.

## API errors & realtime

- **Errors:** every failed request rejects with an `ApiError` (`status`, `code`, `message`, `details`, `requestId`, `kind`). Client-only codes `NETWORK_ERROR`, `TIMEOUT`, `REQUEST_CANCELED`, `UNKNOWN_ERROR` are documented in the backend [error codes](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/error-codes.md).
- **React Query:** queries retry network / timeout / 5xx only (max 2); mutations never retry; unexpected errors show a toast with a short request reference.
- **Realtime:** `RealtimeProvider` + hooks (`useWsStatus`, `useWsEvent`, `useWsTopic`) — see [websocket.md §11](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/websocket.md). It stays **off until Phase 2** provides the ticket endpoint.
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
- **Coverage gate:** `npm run test:coverage` enforces thresholds in `vite.config.ts` (statements 90 · branches 85 · functions 80 · lines 90 — Phase 1 sign-off values rounded down). CI runs it.
- E2E (Playwright) is added after Phase 2.

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
