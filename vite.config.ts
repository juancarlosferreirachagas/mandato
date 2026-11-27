import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('recharts') ||
              id.includes('d3-') ||
              id.includes('framer-motion') ||
              id.includes('@tanstack')
            ) {
              return 'ui-modern';
            }
            return 'vendor';
          }
          if (id.includes('contingenciaOficialGuarulhos')) {
            return 'dados-tce';
          }
          if (id.includes('diariosCatalogoReal')) {
            return 'acervo-diarios';
          }
        },
      },
    },
  },
});
