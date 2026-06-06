import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import LinksAdminView from './LinksAdminView.vue'

const BASE = 'http://localhost:8080'
const LINKS = [{ id: 1, code: 'mes-wip', nameZh: '在制品管理', nameEn: 'WIP', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [{ id: 7, linkId: 1, grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }] }]
beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
  server.use(http.get(`${BASE}/api/admin/links`, () => HttpResponse.json(LINKS)))
})
describe('LinksAdminView', () => {
  it('渲染链接行(名称/代码/分类)', async () => {
    const w = mount(LinksAdminView, { global: { plugins: [i18n] } }); await flushPromises()
    expect(w.text()).toContain('在制品管理'); expect(w.text()).toContain('mes-wip'); expect(w.text()).toContain('MES')
  })
  it('删除走确认 → 调 DELETE', async () => {
    let deleted = false
    server.use(http.delete(`${BASE}/api/admin/links/1`, () => { deleted = true; return new HttpResponse(null, { status: 204 }) }))
    const w = mount(LinksAdminView, { global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    await w.get('[data-testid="del-1"]').trigger('click'); await flushPromises()
    const confirm = [...document.body.querySelectorAll('button')].find((b) => /删除/.test(b.textContent || ''))!
    confirm.click(); await flushPromises()
    expect(deleted).toBe(true)
    w.unmount(); document.body.innerHTML = ''
  })
})
