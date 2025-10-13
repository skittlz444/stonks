import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'public/dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ticker: path.resolve(__dirname, 'src/client/pages/ticker/index.tsx'),
        chartGrid: path.resolve(__dirname, 'src/client/pages/chartGrid/index.tsx'),
        chartLarge: path.resolve(__dirname, 'src/client/pages/chartLarge/index.tsx'),
        chartAdvanced: path.resolve(__dirname, 'src/client/pages/chartAdvanced/index.tsx'),
        prices: path.resolve(__dirname, 'src/client/pages/prices/index.tsx'),
        config: path.resolve(__dirname, 'src/client/pages/config/index.tsx'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client')
    }
  }
});
