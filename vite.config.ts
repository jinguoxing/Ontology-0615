import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        // e2e 编排脚本用 SEMOVIX_MOCK_ORIGIN 指向本次启动的 mock 端口。
        '/api/v1/ontology': {target: process.env.SEMOVIX_MOCK_ORIGIN || 'http://127.0.0.1:4310', changeOrigin: true},
        '/__demo': {target: process.env.SEMOVIX_MOCK_ORIGIN || 'http://127.0.0.1:4310', changeOrigin: true},
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
