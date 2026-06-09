import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { useConfigStore } from './config'

const BASE = 'http://localhost:8080'
describe('config store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    configureClient({ baseUrl: BASE, getToken: () => null, getLocale: () => 'zh', onUnauthorized: () => {} })
  })

  it('load() fetches and caches portal config', async () => {
    server.use(http.get(`${BASE}/api/portal/config`, () =>
      HttpResponse.json({ ssoEnabled: true, authority: 'https://kc.test/realms/r', clientId: 'cim', scopes: 'openid profile', usernameClaim: 'preferred_username' })))
    const store = useConfigStore()
    await store.load()
    expect(store.config.ssoEnabled).toBe(true)
    expect(store.config.authority).toBe('https://kc.test/realms/r')
    expect(store.loaded).toBe(true)
  })

  it('load() falls back to defaults on network failure', async () => {
    server.use(http.get(`${BASE}/api/portal/config`, () => HttpResponse.error()))
    const store = useConfigStore()
    await store.load()
    expect(store.config.ssoEnabled).toBe(false)
    expect(store.config.scopes).toBe('openid profile')
    expect(store.loaded).toBe(true)
  })

  it('load() is idempotent — does not fetch twice', async () => {
    let calls = 0
    server.use(http.get(`${BASE}/api/portal/config`, () => {
      calls++
      return HttpResponse.json({ ssoEnabled: false, scopes: 'openid', usernameClaim: 'sub' })
    }))
    const store = useConfigStore()
    await store.load()
    await store.load()
    expect(calls).toBe(1)
  })
})
