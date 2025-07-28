import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@tanstack/react-query', '@tanstack/react-query-devtools'],
    exclude: ['lucide-react'],
  },
  server: {
    fs: {
      strict: false
    }
  },
  build: {
    commonjsOptions: {
      include: [/@tanstack\/react-query/, /node_modules/]
    }
  }
});