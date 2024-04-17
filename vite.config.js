import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',  // Ensure this is set correctly, especially if you are deploying in a subpath
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
        target: "ws://localhost:8181",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/api1": {
        target: "http://localhost:8181",
        changeOrigin: true,
        secure: false,
      },
      // Redirects to different API endpoints
      "/proxy/ws/": {
        target: "ws://localhost:8181",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/proxy/": {
        target: "http://localhost:8181",
        changeOrigin: true,
        secure: false,
      },
    },
    // logLevel: 'info', // Options are 'info', 'warn', 'error', or 'silent'
  },
})
