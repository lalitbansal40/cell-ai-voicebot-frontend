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
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/**/README.md', 'src/vite-env.d.ts'],
    },
  },
});
