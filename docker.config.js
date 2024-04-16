import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Used in the dockerized web server

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    https: {
        key: fileURLToPath(new URL('./ssl/server.key', import.meta.url)),
        cert: fileURLToPath(new URL('./ssl/server.crt', import.meta.url)),
    },
    proxy: {
      "/api1/ws": {
        target: "ws://api-proxy:8181",
        changeOrigin: true,
        secure: false,
      },
      "/api1": {
        target: "http://api-proxy:8181",
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
