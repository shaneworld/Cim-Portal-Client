import { afterAll, afterEach, beforeAll } from 'vitest'
import { config } from '@vue/test-utils'
import { server } from './msw'
import { i18n } from '@/lib/i18n'

config.global.plugins = [i18n]

function makeLocalStorage() {
  const store: Record<string, string> = {}
  return { getItem: (k: string) => (k in store ? store[k] : null), setItem: (k: string, v: string) => { store[k] = String(v) },
    removeItem: (k: string) => { delete store[k] }, clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
    get length() { return Object.keys(store).length }, key: (n: number) => Object.keys(store)[n] ?? null }
}
Object.defineProperty(globalThis, 'localStorage', { value: makeLocalStorage(), configurable: true, writable: true })
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false } })) as unknown as typeof window.matchMedia
}
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => { server.resetHandlers(); localStorage.clear() })
afterAll(() => server.close())
