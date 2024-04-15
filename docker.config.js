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
        key: fileURLToPath(new URL('./ssl/server.key', import.meta.url)),
        cert: fileURLToPath(new URL('./ssl/server.crt', import.meta.url)),
    },
    proxy: {
      "/api1/ws": {
        target: "ws://api-server:8180",
        changeOrigin: true,
        secure: false,
      },
      "/api1": {
        target: "http://api-server:8180",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
