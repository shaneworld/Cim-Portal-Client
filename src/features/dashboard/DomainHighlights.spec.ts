import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/lib/i18n'
import DomainHighlights from './DomainHighlights.vue'

const cats = [
  { categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [{ id: 1 }, { id: 2 }] },
  { categoryCode: 'QA', categoryLabelZh: '质量', categoryLabelEn: 'QA', links: [{ id: 3 }] },
] as any
describe('DomainHighlights', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh' })
  it('renders one card per category with its localized label + count', () => {
    const w = mount(DomainHighlights, { props: { categories: cats }, global: { plugins: [i18n] } })
    expect(w.text()).toContain('制造执行'); expect(w.text()).toContain('质量')
    expect(w.text()).toContain('2 个系统'); expect(w.findAll('svg').length).toBeGreaterThanOrEqual(2)
  })
})
