# Frontend source layout

| Folder          | Purpose                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `main.tsx`      | Entry: mounts `<App />`                                                                                                 |
| `App.tsx`       | Providers + router                                                                                                      |
| `app/`          | App-wide wiring: providers (theme, React Query, snackbar), query client, routes, router                                 |
| `pages/`        | Route-level pages — only compose features/components, no business logic                                                 |
| `features/`     | Feature folders (`auth/`, `contacts/`, `wallet/`, `flows/`, `calls/`…): components + hooks + API calls for that feature |
| `components/`   | Shared, reusable UI components                                                                                          |
| `layout/`       | App shell: sidebar, header, page layout (Phase 2)                                                                       |
| `hooks/`        | Shared hooks                                                                                                            |
| `services/api/` | HTTP client (`client.ts`) and generated API types (T0.12)                                                               |
| `theme/`        | MUI theme (light + dark color schemes)                                                                                  |
| `types/`        | Shared TypeScript types                                                                                                 |
| `utils/`        | Generic helpers (formatting money, phones, dates…)                                                                      |
| `assets/`       | Static assets imported by code                                                                                          |
| `test/`         | Test setup and render helpers                                                                                           |

## Rules

- Server state → React Query hooks inside the feature folder; no Redux ([ADR 0012](https://github.com/lalitbansal40/cell-ai-voicebot-backend/blob/main/docs/adr/0012-frontend-state.md)).
- Shared components go in `components/` only when used by 2+ features.
- Import with the `@/` alias (`@/theme`, `@/features/...`).
