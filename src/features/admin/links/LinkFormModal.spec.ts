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
    server.use(http.post(`${BASE}/api/admin/links`, () => { created = true; return HttpResponse.json({ id: 50, nameZh: '名', nameEn: 'N', url: 'https://x', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 100, openInNewTab: true, grants: [] }) }))
    server.use(http.put(`${BASE}/api/admin/links/50/grants`, () => { grantsPut = true; return HttpResponse.json([]) }))
    const w = mount(LinkFormModal, { props: { open: true, link: null }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    const setVal = (testid: string, val: string) => {
      const el = document.body.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement
      el.value = val; el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    setVal('f-nameZh', '名'); setVal('f-nameEn', 'N'); setVal('f-url', 'https://x')
    await flushPromises()
    const save = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    save.click(); await flushPromises()
    expect(created).toBe(true); expect(grantsPut).toBe(true)
    w.unmount(); document.body.innerHTML = ''
  })
  it('edit: 从详情加载真实授权,保存整组提交(不清空)', async () => {
    const listLink = { id: 1, nameZh: '在制品', nameEn: 'WIP', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [] }
    server.use(http.get(`${BASE}/api/admin/links/1`, () => HttpResponse.json({ ...listLink, grants: [{ id: 7, linkId: 1, grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }] })))
    server.use(http.put(`${BASE}/api/admin/links/1`, () => HttpResponse.json({ ...listLink, grants: [] })))
    let grantBody: any
    server.use(http.put(`${BASE}/api/admin/links/1/grants`, async ({ request }) => { grantBody = await request.json(); return HttpResponse.json([]) }))
    const w = mount(LinkFormModal, { props: { open: true, link: listLink as never }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    const save = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    save.click(); await flushPromises()
    expect(grantBody.grants).toEqual([{ grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }])
    w.unmount(); document.body.innerHTML = ''
  })
  it('environment Select: 选 UAT 后提交带 environment: UAT', async () => {
    let postBody: any
    server.use(http.post(`${BASE}/api/admin/links`, async ({ request }) => { postBody = await request.json(); return HttpResponse.json({ id: 51, ...postBody, grants: [] }) }))
    server.use(http.put(`${BASE}/api/admin/links/51/grants`, () => HttpResponse.json([])))
    const w = mount(LinkFormModal, { props: { open: true, link: null }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    const setVal = (testid: string, val: string) => {
      const el = document.body.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement
      el.value = val; el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    setVal('f-nameZh', '环境系统'); setVal('f-nameEn', 'EnvSys'); setVal('f-url', 'https://uat.example.com')
    // Emit update:modelValue on the environment Select component directly (reka-ui portal is not a native <select>)
    const SelectComp = (await import('@/lib/ui/Select.vue')).default
    // The env select is the last Select before the category/status selects; find it among all Selects
    const allSelects = w.findAllComponents(SelectComp)
    // env select is the one whose modelValue starts as '__none__'; emit UAT
    const envSelect = allSelects.find((s) => ['__none__', 'DEV', 'UAT', 'RELEASE'].includes((s.props('modelValue') as string)))
    envSelect!.vm.$emit('update:modelValue', 'UAT')
    await flushPromises()
    const save = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    save.click(); await flushPromises()
    expect(postBody.url).toBe('https://uat.example.com')
    expect(postBody.environment).toBe('UAT')
    w.unmount(); document.body.innerHTML = ''
  })
  it('edit with environment: 表单包含 URL 字段和 environment 字段', async () => {
    const envLink = { id: 2, nameZh: '环境系统', nameEn: 'EnvSys', url: 'https://dev.example.com', environment: 'DEV', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [] }
    server.use(http.get(`${BASE}/api/admin/links/2`, () => HttpResponse.json(envLink)))
    server.use(http.put(`${BASE}/api/admin/links/2`, () => HttpResponse.json({ ...envLink, grants: [] })))
    server.use(http.put(`${BASE}/api/admin/links/2/grants`, () => HttpResponse.json([])))
    const w = mount(LinkFormModal, { props: { open: true, link: envLink as never }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    // Single URL field should be present
    expect(document.body.querySelector('[data-testid="f-url"]')).toBeTruthy()
    // Environment section label text should be visible (i18n key: admin.linkForm.environmentLabel)
    expect(document.body.textContent).toContain('环境')
    w.unmount(); document.body.innerHTML = ''
  })
})
