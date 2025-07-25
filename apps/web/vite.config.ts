import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  
  server: {
    port: 3000,
    host: true,
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  
  define: {
    // Para compatibilidade com algumas libs React Native
    global: 'globalThis',
  },
});