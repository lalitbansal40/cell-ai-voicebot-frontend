import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
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
});
