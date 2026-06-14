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
  const m: Record<string,string> = { LINK_CATEGORY: 'MES', LINK_STATUS: 'ACTIVE', LINK_ENV: 'UAT', DEPARTMENT: 'FAB1-PROD', ROLE: 'OPERATOR' }
  for (const c of Object.keys(m))
    server.use(http.get(`${BASE}/api/enums/${c}`, () => HttpResponse.json([{ id: 1, category: c, code: m[c], labelZh: '项', labelEn: 'x', sortOrder: 1, active: true }])))
  server.use(http.get(`${BASE}/api/admin/permission-groups`, () => HttpResponse.json([])))
})
describe('LinkFormModal', () => {
  it('create: 保存调 POST link 再 PUT grants', async () => {
    let created = false, grantsPut = false
    server.use(http.post(`${BASE}/api/admin/links`, () => { created = true; return HttpResponse.json({ id: 50, nameZh: '名', nameEn: 'N', url: 'https://x', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 100, openInNewTab: true, launchApp: false, grants: [] }) }))
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
    const listLink = { id: 1, nameZh: '在制品', nameEn: 'WIP', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, launchApp: false, grants: [] }
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
    server.use(http.post(`${BASE}/api/admin/links`, async ({ request }) => { postBody = await request.json(); return HttpResponse.json({ id: 51, ...postBody, launchApp: false, grants: [] }) }))
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
    const envSelect = allSelects.find((s) => (s.props('modelValue') as string) === '__none__')
    // options come from listEnum('LINK_ENV') + None, not a hardcoded list
    const envOptions = envSelect!.props('options') as { value: string; label: string }[]
    expect(envOptions.map((o) => o.value)).toEqual(['__none__', 'UAT'])
    envSelect!.vm.$emit('update:modelValue', 'UAT')
    await flushPromises()
    const save = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    save.click(); await flushPromises()
    expect(postBody.url).toBe('https://uat.example.com')
    expect(postBody.environment).toBe('UAT')
    w.unmount(); document.body.innerHTML = ''
  })
  it('edit with environment: 表单包含 URL 字段和 environment 字段', async () => {
    const envLink = { id: 2, nameZh: '环境系统', nameEn: 'EnvSys', url: 'https://dev.example.com', environment: 'DEV', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, launchApp: false, grants: [] }
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
  it('launchApp 开关打开:显示 downloadUrl 字段;关闭时隐藏', async () => {
    const SwitchComp = (await import('@/lib/ui/Switch.vue')).default
    const w = mount(LinkFormModal, { props: { open: true, link: null }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    // downloadUrl field hidden initially
    expect(document.body.querySelector('[data-testid="f-downloadUrl"]')).toBeNull()
    // Find the launchApp Switch and toggle it on
    const allSwitches = w.findAllComponents(SwitchComp)
    const launchSwitch = allSwitches.find((s) => {
      const wrap = s.element.closest('[data-testid="f-launchApp-wrap"]')
      return !!wrap
    })
    launchSwitch!.vm.$emit('update:modelValue', true)
    await w.vm.$nextTick()
    expect(document.body.querySelector('[data-testid="f-downloadUrl"]')).toBeTruthy()
    w.unmount(); document.body.innerHTML = ''
  })
  it('launchApp=true 时 downloadUrl 必填;提交时 payload 含 launchApp + downloadUrl', async () => {
    let postBody: any
    server.use(http.post(`${BASE}/api/admin/links`, async ({ request }) => { postBody = await request.json(); return HttpResponse.json({ id: 52, ...postBody, grants: [] }) }))
    server.use(http.put(`${BASE}/api/admin/links/52/grants`, () => HttpResponse.json([])))
    const SwitchComp = (await import('@/lib/ui/Switch.vue')).default
    const w = mount(LinkFormModal, { props: { open: true, link: null }, global: { plugins: [i18n] }, attachTo: document.body }); await flushPromises()
    const setVal = (testid: string, val: string) => {
      const el = document.body.querySelector(`[data-testid="${testid}"]`) as HTMLInputElement
      el.value = val; el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    setVal('f-nameZh', '客户端'); setVal('f-nameEn', 'Client'); setVal('f-url', 'mesclient://launch')
    // Enable launchApp
    const allSwitches = w.findAllComponents(SwitchComp)
    const launchSwitch = allSwitches.find((s) => !!s.element.closest('[data-testid="f-launchApp-wrap"]'))
    launchSwitch!.vm.$emit('update:modelValue', true)
    await w.vm.$nextTick()
    // Try saving without downloadUrl → should show validation error
    const save = [...document.body.querySelectorAll('button')].find((b) => /保存/.test(b.textContent || ''))!
    save.click(); await flushPromises()
    expect(postBody).toBeUndefined() // not submitted
    expect(document.body.textContent).toContain('必填')
    // Fill downloadUrl and save
    setVal('f-downloadUrl', 'https://download.example.com')
    await flushPromises()
    save.click(); await flushPromises()
    expect(postBody?.launchApp).toBe(true)
    expect(postBody?.downloadUrl).toBe('https://download.example.com')
    w.unmount(); document.body.innerHTML = ''
  })
})
