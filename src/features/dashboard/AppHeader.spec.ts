import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '@/router'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import AppHeader from './AppHeader.vue'

describe('AppHeader', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  it('shows the admin link only for admins; shows user name', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const auth = useAuthStore()
    auth.currentUser = { employeeId: 'ADMIN1', displayNameZh: '亚当', displayNameEn: 'Adam', departmentCode: 'IT', roleCode: 'PORTAL_ADMIN', isAdmin: true } as any
    const w = mount(AppHeader, { global: { plugins: [router, i18n] } })
    expect(w.text()).toContain('亚当')
    expect(w.text()).toContain('管理')
  })
})
