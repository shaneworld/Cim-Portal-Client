import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import EnumsAdminView from './EnumsAdminView.vue'

const BASE = 'http://localhost:8080'
beforeEach(() => {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
  server.use(http.get(`${BASE}/api/admin/enums/DEPARTMENT`, () => HttpResponse.json([{ id: 1, category: 'DEPARTMENT', code: 'IT', labelZh: '信息技术', labelEn: 'IT', sortOrder: 10, active: true }])))
  server.use(http.get(`${BASE}/api/admin/enums/ROLE`, () => HttpResponse.json([{ id: 2, category: 'ROLE', code: 'OPERATOR', labelZh: '操作员', labelEn: 'Operator', sortOrder: 10, active: true }])))
})
describe('EnumsAdminView', () => {
  it('默认载入部门;切到角色 tab 载入角色', async () => {
    const w = mount(EnumsAdminView, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(w.text()).toContain('信息技术')
    expect(w.text()).toContain('IT')
    const roleTab = [...w.findAll('button')].find((b) => b.text().includes('角色'))!
    await roleTab.trigger('click')
    await flushPromises()
    expect(w.text()).toContain('操作员')
  })
  it('删除走确认 → DELETE', async () => {
    let del = false
    server.use(http.delete(`${BASE}/api/admin/enums/DEPARTMENT/1`, () => { del = true; return new HttpResponse(null, { status: 204 }) }))
    const w = mount(EnumsAdminView, { global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    await w.get('[data-testid="enum-del-1"]').trigger('click')
    await flushPromises()
    const confirm = [...document.body.querySelectorAll('button')].find((b) => /删除/.test(b.textContent || ''))!
    confirm.click()
    await flushPromises()
    expect(del).toBe(true)
    w.unmount()
    document.body.innerHTML = ''
  })
  it('分页 + 切分类回第 1 页', async () => {
    const dept = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, category: 'DEPARTMENT', code: `D${i + 1}`, labelZh: `部门${i + 1}`, labelEn: `D${i + 1}`, sortOrder: i, active: true }))
    server.use(http.get(`${BASE}/api/admin/enums/DEPARTMENT`, () => HttpResponse.json(dept)))
    server.use(http.get(`${BASE}/api/admin/enums/ROLE`, () => HttpResponse.json([{ id: 99, category: 'ROLE', code: 'OP', labelZh: '操作', labelEn: 'Op', sortOrder: 1, active: true }])))
    const w = mount(EnumsAdminView, { global: { plugins: [i18n] } }); await flushPromises()
    expect(w.findAll('[data-testid^="enum-del-"]').length).toBe(10)
    await w.get('[data-testid="page-next"]').trigger('click'); await flushPromises()
    expect(w.findAll('[data-testid^="enum-del-"]').length).toBe(2)
    const role = [...w.findAll('button')].find((b) => b.text().includes('角色'))!
    await role.trigger('click'); await flushPromises()
    expect(w.text()).toContain('操作'); expect(w.find('[data-testid="page-next"]').exists()).toBe(false)
  })
})
