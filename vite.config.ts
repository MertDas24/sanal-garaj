/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// base './' : site herhangi bir alt dizinde (ör. GitHub Pages proje sayfası) çalışır.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (/node_modules[\\/](three|three-stdlib|@react-three)[\\/]/.test(id)) return 'three';
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
