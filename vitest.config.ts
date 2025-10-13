import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client')
    }
  },
  esbuild: {
    jsx: 'automatic'
  }
});