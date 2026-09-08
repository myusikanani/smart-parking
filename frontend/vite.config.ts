import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Self-signed certs enable HTTPS on the LAN so phone cameras (getUserMedia) work.
const keyPath = resolve(__dirname, '.certs/key.pem');
const certPath = resolve(__dirname, '.certs/cert.pem');
const https = existsSync(keyPath) && existsSync(certPath)
  ? { key: readFileSync(keyPath), cert: readFileSync(certPath) }
  : undefined;

const proxy = {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
  '/socket.io': {
    target: 'http://localhost:5000',
    changeOrigin: true,
    ws: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy,
  },
  preview: {
    ...(https ? { https } : {}),
    proxy,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-3d', test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/ },
            { name: 'charts', test: /[\\/]node_modules[\\/]recharts[\\/]/ },
            { name: 'react-vendor', test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: 'motion', test: /[\\/]node_modules[\\/]framer-motion[\\/]/ },
            { name: 'icons', test: /[\\/]node_modules[\\/](react-icons|lucide-react)[\\/]/ },
          ],
        },
      },
    },
  },
});
