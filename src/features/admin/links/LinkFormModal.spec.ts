import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import LinkFormModal from './LinkFormModal.vue'

const BASE = 'http://localhost:8080'
beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
  const m: Record<string,string> = { LINK_CATEGORY: 'MES', LINK_STATUS: 'ACTIVE', DEPARTMENT: 'FAB1-PROD', ROLE: 'OPERATOR' }
  for (const c of Object.keys(m))
    server.use(http.get(`${BASE}/api/enums/${c}`, () => HttpResponse.json([{ id: 1, category: c, code: m[c], labelZh: '项', labelEn: 'x', sortOrder: 1, active: true }])))
})
describe('LinkFormModal', () => {
  it('create: 保存调 POST link 再 PUT grants', async () => {
    let created = false, grantsPut = false
    server.use(http.post(`${BASE}/api/admin/links`, () => { created = true; return HttpResponse.json({ id: 50, code: 'n', nameZh: '名', nameEn: 'N', url: 'https://x', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 100, openInNewTab: true, grants: [] }) }))
    server.use(http.put(`${BASE}/api/admin/links/50/grants`, () => { grantsPut = true; return HttpResponse.json([]) }))
    const w = mount(LinkFormModal, { props: { open: true, link: null }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    await w.find('[data-testid="f-code"]').setValue('n')
    await w.find('[data-testid="f-nameZh"]').setValue('名')
    await w.find('[data-testid="f-nameEn"]').setValue('N')
    await w.find('[data-testid="f-url"]').setValue('https://x')
    const save = [...document.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    save.click(); await flushPromises()
    expect(created).toBe(true); expect(grantsPut).toBe(true)
    w.unmount(); document.body.innerHTML = ''
  })
})
