/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.spec.ts'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true }, '/dev': { target: 'http://localhost:8080', changeOrigin: true } } },
})
