import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import HeroPanel from './HeroPanel.vue'

const cats = [
  { categoryCode: 'MES', categoryLabelZh: '制造', categoryLabelEn: 'MES', links: [{ id: 1, statusCode: 'ACTIVE' }, { id: 2, statusCode: 'MAINTENANCE' }] },
  { categoryCode: 'QA', categoryLabelZh: '质量', categoryLabelEn: 'QA', links: [{ id: 3, statusCode: 'ACTIVE' }] },
] as any

describe('HeroPanel', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  it('shows greeting + identity + clock + real stats (no sample metrics)', () => {
    const auth = useAuthStore()
    auth.currentUser = { employeeId: 'OP1', displayNameZh: '欧阳操作', displayNameEn: 'O', departmentCode: 'FAB1-PROD', roleCode: 'OPERATOR', isAdmin: false } as any
    const w = mount(HeroPanel, { props: { categories: cats }, global: { plugins: [i18n] } })
    const t = w.text()
    expect(t).toMatch(/好/)               // greeting
    expect(t).toContain('欧阳操作')
    expect(t).toContain('FAB1-PROD'); expect(t).toContain('OP1')   // identity + 工号
    expect(t).toContain('系统'); expect(t).toContain('3')          // 3 links total
    expect(t).toContain('类别'); expect(t).toContain('在线')
    expect(t).not.toMatch(/OEE|SAMPLE|示例/)                       // sample metrics removed
  })
})
