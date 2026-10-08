# Frontend source layout

| Folder               | Purpose                                                                                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.tsx`           | Entry: mounts `<App />`                                                                                                                                                                           |
| `App.tsx`            | Providers + router                                                                                                                                                                                |
| `app/`               | App-wide wiring: providers (theme, React Query, snackbar), query client, routes, router                                                                                                           |
| `pages/dev/`         | DEV-only tools (`/dev/realtime`) — routed only when `import.meta.env.DEV`, not in production builds                                                                                               |
| `pages/`             | Route-level pages — only compose features/components, no business logic                                                                                                                           |
| `features/system/`   | `useSystemInfo()` + `SystemInfoCard` (home page API status — proves API + proxy end to end)                                                                                                       |
| `features/`          | Feature folders (`auth/`, `contacts/`, `wallet/`, `flows/`, `calls/`…): components + hooks + API calls for that feature                                                                           |
| `components/`        | Shared, reusable UI components                                                                                                                                                                    |
| `layout/`            | App shell: sidebar, header, page layout (Phase 2)                                                                                                                                                 |
| `hooks/`             | Shared hooks                                                                                                                                                                                      |
| `services/api/`      | HTTP client (`client.ts` — every failure becomes an `ApiError`, `unwrap()` for envelopes), `errors.ts` (`ApiError`, `getErrorMessage`, `applyFieldErrors`), generated API types (`schema.gen.ts`) |
| `services/realtime/` | `/ws/events` client: `RealtimeClient`, `RealtimeProvider`, hooks `useWsStatus` / `useWsEvent` / `useWsTopic`, typed event map (keep in sync with websocket.md §5)                                 |
| `theme/`             | MUI theme (light + dark color schemes)                                                                                                                                                            |
| `types/`             | Shared TypeScript types                                                                                                                                                                           |
| `utils/`             | Generic helpers (formatting money, phones, dates…)                                                                                                                                                |
| `assets/`            | Static assets imported by code                                                                                                                                                                    |
| `test/`              | Test setup, `renderWithProviders`, `FakeWebSocket`                                                                                                                                                |

## Rules

- Server state → React Query hooks inside the feature folder; no Redux ([ADR 0012](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/adr/0012-frontend-state.md)).
- Shared components go in `components/` only when used by 2+ features.
- Import with the `@/` alias (`@/theme`, `@/features/...`).
- Errors: use `ApiError` / `getErrorMessage()` / `applyFieldErrors()` — never read raw axios errors. 4xx are handled by the screen; unexpected errors (5xx, network, timeout) get a global toast automatically. Pass `meta: { silent: true }` when the screen shows the error itself.
- Queries retry only network / timeout / 5xx (max 2); mutations never retry.
- Realtime: subscribe with `useWsEvent(type, handler)` / `useWsTopic('call:<id>')` inside components; after a reconnect all queries are invalidated (missed events are not replayed).
