import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { i18n } from '@/lib/i18n'
import DisplaySettingsAdminView from './DisplaySettingsAdminView.vue'

const BASE = 'http://localhost:8080'

describe('DisplaySettingsAdminView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    i18n.global.locale.value = 'zh'
    configureClient({ baseUrl: BASE, getToken: () => 'admin-token', getLocale: () => 'zh', onUnauthorized: () => {} })
  })

  const mockSettings = {
    ssoEnabled: false,
    scopes: 'openid profile',
    usernameClaim: 'preferred_username',
    heroEnabled: true,
    infoPanelEnabled: false,
  }

  it('renders hero and info-panel switches on load', async () => {
    server.use(
      http.get(`${BASE}/api/admin/security-settings`, () => HttpResponse.json(mockSettings)),
    )

    const w = mount(DisplaySettingsAdminView, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    expect(document.body.querySelector('[data-testid="hero-enabled"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="info-panel-enabled"]')).not.toBeNull()

    w.unmount(); document.body.innerHTML = ''
  })

  it('save calls updateSecuritySettings with heroEnabled + infoPanelEnabled then reloads config', async () => {
    let capturedBody: unknown = null
    server.use(
      http.get(`${BASE}/api/admin/security-settings`, () => HttpResponse.json(mockSettings)),
      http.put(`${BASE}/api/admin/security-settings`, async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json({ ...mockSettings, infoPanelEnabled: true })
      }),
      http.get(`${BASE}/api/portal/config`, () =>
        HttpResponse.json({ ssoEnabled: false, scopes: 'openid profile', usernameClaim: 'preferred_username', heroEnabled: true, infoPanelEnabled: true })),
    )

    const w = mount(DisplaySettingsAdminView, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    const saveBtn = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    saveBtn.click()
    await flushPromises()

    expect(capturedBody).toMatchObject({ heroEnabled: true, infoPanelEnabled: false })

    w.unmount(); document.body.innerHTML = ''
  })

  it('save does NOT include ssoEnabled or SSO fields', async () => {
    let capturedBody: Record<string, unknown> | null = null
    server.use(
      http.get(`${BASE}/api/admin/security-settings`, () => HttpResponse.json(mockSettings)),
      http.put(`${BASE}/api/admin/security-settings`, async ({ request }) => {
        capturedBody = await request.json() as Record<string, unknown>
        return HttpResponse.json(mockSettings)
      }),
      http.get(`${BASE}/api/portal/config`, () =>
        HttpResponse.json({ ssoEnabled: false, scopes: 'openid profile', usernameClaim: 'preferred_username' })),
    )

    const w = mount(DisplaySettingsAdminView, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    const saveBtn = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    saveBtn.click()
    await flushPromises()

    expect(capturedBody).not.toHaveProperty('ssoEnabled')
    expect(capturedBody).not.toHaveProperty('issuerUri')

    w.unmount(); document.body.innerHTML = ''
  })
})
