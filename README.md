# Cell AI Voicebot — Frontend

Dashboard for the multi-tenant AI voice calling platform (React 19 + TypeScript + Vite + MUI).

## Status

Phase 0 — setup & architecture decisions.

## Prerequisites

- **Node.js 24 LTS** (`.nvmrc` = `24`; `engine-strict=true` blocks other versions)
- **npm ≥ 10**
- Backend API running on `http://localhost:5100` (from Phase 1) — the dev server proxies `/api` and `/ws` to it.

## Getting started

```bash
npm ci        # install exact dependencies from the lockfile
npm run dev   # http://localhost:3100
```

## Ports

| What                            | Port |
| ------------------------------- | ---- |
| Vite dev server                 | 3100 |
| `vite preview`                  | 3101 |
| Proxy `/api` → backend API      | 5100 |
| Proxy `/ws` → backend WebSocket | 5100 |

## Scripts

| Script                  | What it does                               |
| ----------------------- | ------------------------------------------ |
| `npm run dev`           | Vite dev server with HMR on port 3100      |
| `npm run build`         | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview`       | Serve the production build on port 3101    |
| `npm run typecheck`     | Type-check all TS projects                 |
| `npm run lint`          | ESLint (type-aware), fails on any warning  |
| `npm run lint:fix`      | ESLint with auto-fix                       |
| `npm run format`        | Prettier write                             |
| `npm run format:check`  | Prettier check                             |
| `npm test`              | Run all tests once (Vitest + jsdom)        |
| `npm run test:watch`    | Vitest watch mode                          |
| `npm run test:coverage` | Tests + coverage report in `coverage/`     |

## Folder structure

See [src/README.md](src/README.md). Key stack: React Router (data router), React Query, MUI (light + dark color schemes), notistack, axios, zod, react-hook-form.

## Testing

- **Runner:** Vitest with `jsdom` + React Testing Library (`@testing-library/jest-dom` matchers, `user-event`).
- Tests live next to the code: `src/**/*.test.tsx`.
- `src/test/setup.ts` registers matchers and cleans up after each test.
- `src/test/render.tsx` → `renderWithProviders({ route })` renders the real app routes with theme + React Query (retries off) on a memory router.
- E2E (Playwright) is added after Phase 2.

## Code quality

- ESLint (type-aware `typescript-eslint`, `import-x`, `react-hooks`, `react-refresh`) + Prettier.
- Husky hooks: `pre-commit` → lint-staged; `commit-msg` → commitlint (Conventional Commits).
- npm 11 install-script approvals live in `package.json` → `allowScripts` (`unrs-resolver: true`, `fsevents: false`). Review new ones with `npm approve-scripts --allow-scripts-pending`.

## Environment variables

Copy `.env.example` → `.env.local` (gitignored). **Every `VITE_*` variable is public** — it is compiled into the browser bundle, so never put a secret here. Policy: [secrets.md](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/secrets.md).

| Variable        | Required               | Description                                                  |
| --------------- | ---------------------- | ------------------------------------------------------------ |
| `VITE_API_URL`  | no (default `/api/v1`) | API base URL; default uses the dev proxy to `:5100`          |
| `VITE_WS_URL`   | yes (Phase 1+)         | Dashboard WebSocket URL (`ws://localhost:3100/ws` via proxy) |
| `VITE_APP_NAME` | no                     | Display name of the app                                      |

## Docs

All project docs (plans, ADRs, conventions) live in the **backend repo** `docs/` folder:
<https://github.com/lalitbansal40/cell-ai-voicebot-backend/tree/main/docs> (locally: `../cell-ai-voicebot-backend/docs/`).

## Conventions

- [Definition of Done](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/conventions/definition-of-done.md)
- [Architecture Decision Records](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/adr/README.md)
