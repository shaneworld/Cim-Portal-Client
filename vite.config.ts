/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.spec.ts'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // host:true binds all loopback/LAN interfaces (not just [::1]) so the page AND the HMR
  // websocket resolve to the same host whether reached via localhost or 127.0.0.1 — avoids
  // the IPv6/IPv4 mismatch that makes the HMR socket drop and the page reconnect/reload-flicker.
  // strictPort fails loudly instead of drifting to another port (which would orphan open tabs).
  server: { host: true, port: 5173, strictPort: true, proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true }, '/dev': { target: 'http://localhost:8080', changeOrigin: true } } },
})
