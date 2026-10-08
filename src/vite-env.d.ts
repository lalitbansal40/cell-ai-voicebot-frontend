/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional — defaults to `/api/v1` (dev proxy). */
  readonly VITE_API_URL?: string;
  /** Optional WebSocket base (e.g. `ws://localhost:3100/ws`) — defaults to the page origin. */
  readonly VITE_WS_URL?: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
