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
        'public/dist/**',
        // React page entry points - these just mount React apps
        'src/client/pages/**/index.tsx',
        // Type definitions - no logic to test
        'src/client/types/**',
        // TradingView widgets - require browser DOM and external scripts
        'src/client/components/charts/**',
        // Custom hooks - require browser environment and API calls
        'src/client/hooks/**',
        // Main React app component - simple router
        'src/client/App.tsx',
        'src/client/index.tsx',
        // Page components - integration level, tested via E2E
        'src/client/pages/**/*.tsx'
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