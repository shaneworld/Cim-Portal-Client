import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import EnumFormModal from './EnumFormModal.vue'

const BASE = 'http://localhost:8080'
beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }) })

describe('EnumFormModal', () => {
  it('create: 保存调 POST /api/admin/enums/{category}', async () => {
    let body: any
    server.use(http.post(`${BASE}/api/admin/enums/DEPARTMENT`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ id: 9, category: 'DEPARTMENT', ...body }) }))
    const w = mount(EnumFormModal, { props: { open: true, category: 'DEPARTMENT', value: null }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    const set = (id: string, v: string) => { const el = document.body.querySelector(`[data-testid="${id}"]`) as HTMLInputElement; el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })) }
    set('e-code', 'MAINT'); set('e-zh', '维修'); set('e-en', 'Maint')
    await flushPromises()
    const save = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    save.click(); await flushPromises()
    expect(body.code).toBe('MAINT'); expect(body.labelZh).toBe('维修')
    w.unmount(); document.body.innerHTML = ''
  })
})
