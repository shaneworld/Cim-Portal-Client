import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { i18n } from '@/lib/i18n'
import SecurityAdminView from './SecurityAdminView.vue'

const BASE = 'http://localhost:8080'

describe('SecurityAdminView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    i18n.global.locale.value = 'zh'
    configureClient({ baseUrl: BASE, getToken: () => 'admin-token', getLocale: () => 'zh', onUnauthorized: () => {} })
  })

  const mockSettings = {
    ssoEnabled: true,
    issuerUri: 'https://kc.test/realms/r',
    clientId: 'cim-portal',
    scopes: 'openid profile',
    usernameClaim: 'preferred_username',
    heroEnabled: true,
    infoPanelEnabled: true,
    updatedAt: '2024-01-01T00:00:00Z',
  }

  function setVal(testid: string, val: string) {
    const el = document.body.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement
    el.value = val
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('loads security settings on mount', async () => {
    server.use(http.get(`${BASE}/api/admin/security-settings`, () => HttpResponse.json(mockSettings)))

    const w = mount(SecurityAdminView, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    expect((document.body.querySelector('[data-testid="issuer-uri"]') as HTMLInputElement).value).toBe('https://kc.test/realms/r')
    expect((document.body.querySelector('[data-testid="client-id"]') as HTMLInputElement).value).toBe('cim-portal')
    expect((document.body.querySelector('[data-testid="scopes"]') as HTMLInputElement).value).toBe('openid profile')
    expect((document.body.querySelector('[data-testid="username-claim"]') as HTMLInputElement).value).toBe('preferred_username')

    w.unmount(); document.body.innerHTML = ''
  })

  it('save sends full payload including initialPassword when provided', async () => {
    let capturedBody: unknown = null
    server.use(
      http.get(`${BASE}/api/admin/security-settings`, () => HttpResponse.json(mockSettings)),
      http.put(`${BASE}/api/admin/security-settings`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockSettings, ssoEnabled: false })
      }),
    )

    const w = mount(SecurityAdminView, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    setVal('initial-password', 'newpass123')

    const saveBtn = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    saveBtn.click()
    await flushPromises()

    expect(capturedBody).toMatchObject({
      ssoEnabled: true,
      issuerUri: 'https://kc.test/realms/r',
      clientId: 'cim-portal',
      scopes: 'openid profile',
      usernameClaim: 'preferred_username',
      initialPassword: 'newpass123',
    })

    w.unmount(); document.body.innerHTML = ''
  })

  it('save omits initialPassword when blank', async () => {
    let capturedBody: unknown = null
    server.use(
      http.get(`${BASE}/api/admin/security-settings`, () => HttpResponse.json(mockSettings)),
      http.put(`${BASE}/api/admin/security-settings`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(mockSettings)
      }),
    )

    const w = mount(SecurityAdminView, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    const saveBtn = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    saveBtn.click()
    await flushPromises()

    expect((capturedBody as Record<string, unknown>).initialPassword).toBeUndefined()

    w.unmount(); document.body.innerHTML = ''
  })
})
