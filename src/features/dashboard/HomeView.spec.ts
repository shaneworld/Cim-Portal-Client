import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import HomeView from './HomeView.vue'

const BASE = 'http://localhost:8080'
describe('HomeView (placeholder)', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
    configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }) })
  it('greets the signed-in user and shows a placeholder', async () => {
    const auth = useAuthStore()
    auth.currentUser = { employeeId: 'OP1', displayNameZh: '欧阳操作', displayNameEn: 'Oliver', departmentCode: 'FAB1-PROD', roleCode: 'OPERATOR', isAdmin: false } as any
    server.use(http.get(`${BASE}/api/portal/home`, () => HttpResponse.json({ categories: [] })))
    const w = mount(HomeView, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(w.text()).toContain('欧阳操作')
    expect(w.text()).toContain('仪表盘')
  })
})
