import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolveDevProxyTarget } from './vite.proxyTarget.js';

const devProxyTarget = resolveDevProxyTarget(process.env);

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
    proxy: {
      '/api': {
        target: devProxyTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: devProxyTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
