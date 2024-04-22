import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const API_PROXY = process.env.VITE_API_PROXY || 'http://localhost:8180'
const API_WS_PROXY = API_PROXY.replace(/^http/, 'ws')


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
      "/login": {
        target: API_PROXY,
        changeOrigin: true,
        secure: false,
      },
      "/api1/ws": {
        target: API_WS_PROXY,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/api1": {
        target: API_PROXY,
        changeOrigin: true,
        secure: false,
      },
      // Redirects to different API endpoints
      "/proxy/ws/": {
        target: API_WS_PROXY,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      "/proxy/": {
        target: API_PROXY,
        changeOrigin: true,
        secure: false,
      },
    },
    // logLevel: 'info', // Options are 'info', 'warn', 'error', or 'silent'
  },
})
