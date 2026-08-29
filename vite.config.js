import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/Resume/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        metageo: resolve(import.meta.dirname, 'projects/metageo/index.html'),
        crossPlatformMcp: resolve(import.meta.dirname, 'projects/cross-platform-mcp/index.html'),
        websearch: resolve(import.meta.dirname, 'projects/websearch/index.html'),
        stockgenie: resolve(import.meta.dirname, 'projects/stockgenie/index.html'),
        medicore: resolve(import.meta.dirname, 'projects/medicore/index.html'),
        erp: resolve(import.meta.dirname, 'projects/erp/index.html'),
      },
    },
  },
});
