import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { i18n } from '@/lib/i18n'
import FeishuAdminView from './FeishuAdminView.vue'

const BASE = 'http://localhost:8080'

describe('FeishuAdminView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    i18n.global.locale.value = 'zh'
    configureClient({ baseUrl: BASE, getToken: () => 'admin-token', getLocale: () => 'zh', onUnauthorized: () => {} })
  })

  const mockSettings = {
    larkBaseUrl: 'https://open.feishu.cn',
    larkAppId: 'cli_app',
    larkReceiverId: 'oc_chat',
    larkReceiverIdType: 'open_id',
    larkAppSecretConfigured: true,
  }

  function setVal(testid: string, val: string) {
    const el = document.body.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement
    el.value = val
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }

  it('loads and binds lark fields on mount; secret stays empty', async () => {
    server.use(http.get(`${BASE}/api/admin/lark-settings`, () => HttpResponse.json(mockSettings)))
    const w = mount(FeishuAdminView, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    expect((document.body.querySelector('[data-testid="lark-base-url"]') as HTMLInputElement).value).toBe('https://open.feishu.cn')
    expect((document.body.querySelector('[data-testid="lark-app-id"]') as HTMLInputElement).value).toBe('cli_app')
    expect((document.body.querySelector('[data-testid="lark-receiver-id"]') as HTMLInputElement).value).toBe('oc_chat')
    expect((document.body.querySelector('[data-testid="lark-app-secret"]') as HTMLInputElement).value).toBe('')
    w.unmount(); document.body.innerHTML = ''
  })

  it('save sends larkAppSecret only when the input has a value', async () => {
    let capturedBody: Record<string, unknown> = {}
    server.use(
      http.get(`${BASE}/api/admin/lark-settings`, () => HttpResponse.json(mockSettings)),
      http.put(`${BASE}/api/admin/lark-settings`, async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(mockSettings)
      }),
    )
    const w = mount(FeishuAdminView, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    const saveBtn = () => [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!

    saveBtn().click()
    await flushPromises()
    expect(capturedBody.larkAppSecret).toBeUndefined()
    expect(capturedBody).toMatchObject({
      larkBaseUrl: 'https://open.feishu.cn',
      larkAppId: 'cli_app',
      larkReceiverId: 'oc_chat',
      larkReceiverIdType: 'open_id',
    })

    setVal('lark-app-secret', 'super-secret')
    saveBtn().click()
    await flushPromises()
    expect(capturedBody.larkAppSecret).toBe('super-secret')

    w.unmount(); document.body.innerHTML = ''
  })
})
