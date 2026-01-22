
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true // Autorise tous les domaines CodeSandbox pour le dev
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: true // Autorise tous les domaines CodeSandbox pour la preview
  },
  build: {
    outDir: 'dist',
    target: 'esnext'
  }
});
