import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import HeroPanel from './HeroPanel.vue'

describe('HeroPanel', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  it('greets the user and renders the OEE gauge + KPIs (sample)', async () => {
    const auth = useAuthStore()
    auth.currentUser = { employeeId: 'OP1', displayNameZh: '欧阳操作', displayNameEn: 'O', departmentCode: 'FAB1-PROD', roleCode: 'OPERATOR', isAdmin: false } as any
    const w = mount(HeroPanel, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(w.text()).toContain('欧阳操作')
    expect(w.find('svg').exists()).toBe(true)
    expect(w.text()).toContain('87.4')
    expect(w.text()).toContain('示例')
  })
})
