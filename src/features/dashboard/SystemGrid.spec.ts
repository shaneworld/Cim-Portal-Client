import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/lib/i18n'
import SystemGrid from './SystemGrid.vue'

const cats = [{ categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [
  { id: 1, code: 'mes-wip', nameZh: '在制品管理', nameEn: 'WIP', url: 'https://x', icon: 'factory', statusCode: 'ACTIVE', openInNewTab: true },
  { id: 2, code: 'old', nameZh: '旧门户', nameEn: 'Legacy', url: 'https://y', icon: 'archive', statusCode: 'DEPRECATED', openInNewTab: false },
] }] as any
describe('SystemGrid', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh' })
  it('renders link cards with localized name + href/target + status', () => {
    const w = mount(SystemGrid, { props: { categories: cats }, global: { plugins: [i18n] } })
    expect(w.text()).toContain('在制品管理')
    const a = w.findAll('a')
    expect(a[0].attributes('href')).toBe('https://x'); expect(a[0].attributes('target')).toBe('_blank')
    expect(w.findAll('svg').length).toBeGreaterThanOrEqual(2)
  })
})
