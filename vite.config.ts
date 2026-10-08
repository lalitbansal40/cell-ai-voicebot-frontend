import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/ · https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3100,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:5100', changeOrigin: true },
      '/ws': { target: 'ws://localhost:5100', ws: true },
    },
  },
  preview: {
    port: 3101,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**'],
      // main.tsx only mounts <App /> into the DOM (App itself is tested).
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/**/README.md',
        'src/vite-env.d.ts',
        'src/main.tsx',
      ],
      // Gate = measured coverage at Phase 2 sign-off rounded down to the nearest 5
      // (91.9 / 87.9 / 86.2 / 93.8) — CI fails if coverage drops below it.
      thresholds: { statements: 90, branches: 85, functions: 85, lines: 90 },
    },
  },
});
