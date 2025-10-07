import { defineConfig } from 'vitest/config';

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
        '**/*.config.js',
        'worker-configuration.d.ts',
        '.wrangler/**',
        'public/sw.js'
      ]
    },
    globals: true,
    setupFiles: ['./test/setup.js']
  }
});