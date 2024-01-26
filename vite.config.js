import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // Redirect API calls to API
  server: {
    https: {
        key: 'ssl/server.key',
        cert: 'ssl/server.crt',
    },
    // When needed, use: npm run dev -- --host
    // host: true, // listen in all interfaces
    proxy: {
      "/api1/ws": {
        target: "ws://localhost:8180",
        changeOrigin: true,
        secure: false,
      },
      "/api1": {
        target: "http://localhost:8180",
        changeOrigin: true,
        secure: false,
      },
    },
  },})
