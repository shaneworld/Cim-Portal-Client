import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { routes } from '@/router'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import HomeView from './HomeView.vue'

const BASE = 'http://localhost:8080'
function mountHome() {
  const router = createRouter({ history: createMemoryHistory(), routes })
  return mount(HomeView, { global: { plugins: [router, i18n] } })
}
describe('HomeView', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
    configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
    const a = useAuthStore(); a.currentUser = { employeeId: 'OP1', displayNameZh: '欧阳操作', displayNameEn: 'O', departmentCode: 'FAB1-PROD', roleCode: 'OPERATOR', isAdmin: false } as any
    server.use(
      http.get(`${BASE}/api/portal/config`, () => HttpResponse.json({ ssoEnabled: false, scopes: 'openid profile', usernameClaim: 'preferred_username', heroEnabled: true, infoPanelEnabled: false })),
      http.get(`${BASE}/api/portal/home`, () => HttpResponse.json({ categories: [
        { categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [
          { id: 1, nameZh: '在制品管理', nameEn: 'WIP', url: 'x', icon: 'factory', statusCode: 'ACTIVE', openInNewTab: true, accessible: true },
          { id: 2, nameZh: '设备效率', nameEn: 'OEE', url: 'x', icon: 'gauge', statusCode: 'ACTIVE', openInNewTab: true, accessible: true },
        ] } ] })),
    )
  })
  it('renders hero + domains + systems, and filters by search', async () => {
    const w = mountHome(); await flushPromises()
    expect(w.text()).toContain('欧阳操作')
    expect(w.text()).toContain('制造执行')
    expect(w.text()).toContain('在制品管理')
    await w.get('input').setValue('在制品')
    expect(w.text()).toContain('在制品管理'); expect(w.text()).not.toContain('设备效率')
  })
  it('info panel appears reactively when config flips infoPanelEnabled on (no refresh)', async () => {
    server.use(
      http.get(`${BASE}/api/portal/announcements`, () => HttpResponse.json([])),
      http.get(`${BASE}/api/portal/duty-lines`, () => HttpResponse.json([])),
    )
    const announcementsTitle = i18n.global.t('dashboard.announcements.title')
    const w = mountHome(); await flushPromises()
    // Mounted with infoPanelEnabled:false → panel not present
    expect(w.text()).not.toContain(announcementsTitle)
    // Simulate config.reload() replacing the config object (as the real store does)
    const cfg = useConfigStore()
    cfg.config = { ...cfg.config, infoPanelEnabled: true }
    await flushPromises()
    // storeToRefs keeps `config` reactive → v-if re-evaluates → panel mounts
    expect(w.text()).toContain(announcementsTitle)
  })

  it('shows empty state when no systems', async () => {
    server.use(
      http.get(`${BASE}/api/portal/home`, () => HttpResponse.json({ categories: [] })),
    )
    const w = mountHome(); await flushPromises()
    expect(w.text()).toContain('暂无可访问的系统')
  })
})
