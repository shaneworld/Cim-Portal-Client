import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { i18n } from '@/lib/i18n'
import DutySettingsForm from './DutySettingsForm.vue'

const BASE = 'http://localhost:8080'

describe('DutySettingsForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    i18n.global.locale.value = 'zh'
    configureClient({ baseUrl: BASE, getToken: () => 'admin-token', getLocale: () => 'zh', onUnauthorized: () => {} })
  })

  const mockSettings = { dutyApiBaseUrl: 'https://duty.example.com', dutyApiKeyConfigured: true }

  function setVal(testid: string, val: string) {
    const el = document.body.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement
    el.value = val
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('loads and binds duty fields on mount; key stays empty', async () => {
    server.use(http.get(`${BASE}/api/admin/duty-settings`, () => HttpResponse.json(mockSettings)))
    const w = mount(DutySettingsForm, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect((document.body.querySelector('[data-testid="duty-api-base-url"]') as HTMLInputElement).value).toBe('https://duty.example.com')
    expect((document.body.querySelector('[data-testid="duty-api-key"]') as HTMLInputElement).value).toBe('')
    w.unmount(); document.body.innerHTML = ''
  })

  it('save sends dutyApiKey only when the input has a value', async () => {
    let capturedBody: Record<string, unknown> = {}
    server.use(
      http.get(`${BASE}/api/admin/duty-settings`, () => HttpResponse.json(mockSettings)),
      http.put(`${BASE}/api/admin/duty-settings`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(mockSettings)
      }),
    )
    const w = mount(DutySettingsForm, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    const saveBtn = () => [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!

    saveBtn().click()
    await flushPromises()
    expect(capturedBody.dutyApiKey).toBeUndefined()
    expect(capturedBody).toMatchObject({ dutyApiBaseUrl: 'https://duty.example.com' })

    setVal('duty-api-key', 'k-secret')
    saveBtn().click()
    await flushPromises()
    expect(capturedBody.dutyApiKey).toBe('k-secret')

    w.unmount(); document.body.innerHTML = ''
  })
})
