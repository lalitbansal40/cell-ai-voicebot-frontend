import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

import {
  BACKEND_HEALTH_URL,
  E2E_MONGODB_URI,
  E2E_REDIS_URL,
  FRONTEND_PORT,
  FRONTEND_URL,
  SUPERADMIN,
} from './e2e/env';

const backendDir = fileURLToPath(new URL('../cell-ai-voicebot-backend', import.meta.url));
const prepareScript = fileURLToPath(new URL('./e2e/prepare-backend.mjs', import.meta.url));
/** `E2E_BACKEND_LOGS=1` prints backend logs (info) — used by the secret-in-logs check. */
const backendLogs = Boolean(process.env.E2E_BACKEND_LOGS);

/**
 * End-to-end tests against the real backend (isolated `cav_e2e` database,
 * Redis db 5) and Mailpit. Needs `npm run infra:up` in the backend first.
 * Secrets (JWT keys …) come from the backend's own .env.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  // One worker: specs share the auth rate limiter and the Mailpit inbox.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: FRONTEND_URL,
    timezoneId: 'Asia/Kolkata',
    locale: 'en-IN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      name: 'backend',
      cwd: backendDir,
      command: `node ${prepareScript} && npx tsx --env-file-if-exists=.env src/index.ts`,
      url: BACKEND_HEALTH_URL,
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: backendLogs ? 'pipe' : 'ignore',
      stderr: 'pipe',
      // Real env vars win over the backend's .env file.
      env: {
        NODE_ENV: 'development',
        PORT: '5100',
        LOG_LEVEL: backendLogs ? 'info' : 'warn',
        FRONTEND_URL,
        CORS_ORIGINS: FRONTEND_URL,
        MONGODB_URI: E2E_MONGODB_URI,
        REDIS_URL: E2E_REDIS_URL,
        WORKERS_ENABLED: 'true',
        EMAIL_DRIVER: 'smtp',
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: '1025',
        SMTP_SECURE: 'false',
        // Phase 4: test payments + the billing simulator (never in production)
        PAYMENT_PROVIDER: 'fake',
        BILLING_SIMULATOR_ENABLED: 'true',
        BILLING_SELLER_STATE_CODE: '08',
        E2E_SUPERADMIN_EMAIL: SUPERADMIN.email,
        E2E_SUPERADMIN_PASSWORD: SUPERADMIN.password,
      },
    },
    {
      name: 'frontend',
      command: `npm run dev -- --port ${FRONTEND_PORT} --strictPort`,
      url: FRONTEND_URL,
      reuseExistingServer: false,
      timeout: 60_000,
      stdout: 'ignore',
      // Same origin for API + WebSocket (through the Vite proxy) whatever the port —
      // a developer's .env.local may point VITE_WS_URL at :3100.
      env: { VITE_API_URL: '/api/v1', VITE_WS_URL: '' },
    },
  ],
});
