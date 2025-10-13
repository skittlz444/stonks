import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'migrations/**',
        'local-db/**',
        'coverage/**',
        '**/*.test.js',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.js',
        '**/*.config.ts',
        'worker-configuration.d.ts',
        '.wrangler/**',
        'public/sw.js',
        'public/dist/**'
      ]
    },
    globals: true,
    setupFiles: ['./test/setup.js', './test/setup.tsx']
  }
});