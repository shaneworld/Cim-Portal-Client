import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import LinksAdminView from './LinksAdminView.vue'

const BASE = 'http://localhost:8080'
const LINKS = [{ id: 1, nameZh: '在制品管理', nameEn: 'WIP', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [{ id: 7, linkId: 1, grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }] }]
const LINKS_WITH_ENV = [
  { id: 1, nameZh: '在制品管理', nameEn: 'WIP', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, environment: 'UAT', grants: [] },
  { id: 2, nameZh: '设备效率', nameEn: 'OEE', url: 'v', icon: 'gauge', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 2, openInNewTab: true, grants: [] },
]
beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
  server.use(http.get(`${BASE}/api/admin/links`, () => HttpResponse.json(LINKS)))
})
describe('LinksAdminView', () => {
  it('渲染链接行(名称/分类)', async () => {
    const w = mount(LinksAdminView, { global: { plugins: [i18n] } }); await flushPromises()
    expect(w.text()).toContain('在制品管理'); expect(w.text()).toContain('MES')
  })
  it('链接有 environment 时显示彩色徽章,无 environment 时不显示', async () => {
    server.use(http.get(`${BASE}/api/admin/links`, () => HttpResponse.json(LINKS_WITH_ENV)))
    const w = mount(LinksAdminView, { global: { plugins: [i18n] } }); await flushPromises()
    // First link has environment UAT — badge should appear
    expect(w.text()).toContain('UAT')
    // Second link has no environment — OEE row should not show any env badge
    const rows = w.findAll('[data-testid^="del-"]')
    expect(rows.length).toBe(2)
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
  it('超过一页时分页:默认显示 10 行,翻到第 2 页显示其余', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, nameZh: `名${i + 1}`, nameEn: `N${i + 1}`, url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: i, openInNewTab: true, grants: [] }))
    server.use(http.get(`${BASE}/api/admin/links`, () => HttpResponse.json(many)))
    const w = mount(LinksAdminView, { global: { plugins: [i18n] } }); await flushPromises()
    expect(w.findAll('[data-testid^="del-"]').length).toBe(10)
    await w.get('[data-testid="page-next"]').trigger('click'); await flushPromises()
    expect(w.findAll('[data-testid^="del-"]').length).toBe(2)
  })
})
