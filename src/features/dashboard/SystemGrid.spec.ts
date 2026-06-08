import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import SystemGrid from './SystemGrid.vue'

const cats = [{ categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [
  { id: 1, nameZh: '在制品管理', nameEn: 'WIP', url: 'https://x', icon: 'factory', statusCode: 'ACTIVE', openInNewTab: true, launchApp: false },
  { id: 2, nameZh: '旧门户', nameEn: 'Legacy', url: 'https://y', icon: 'archive', statusCode: 'DEPRECATED', openInNewTab: false, launchApp: false },
] }] as any

const catsWithEnv = [{ categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [
  { id: 3, nameZh: '开发系统', nameEn: 'DevSys', url: 'https://dev', icon: 'factory', statusCode: 'ACTIVE', openInNewTab: true, environment: 'DEV', launchApp: false },
  { id: 4, nameZh: '生产系统', nameEn: 'ProdSys', url: 'https://rel', icon: 'gauge', statusCode: 'ACTIVE', openInNewTab: true, launchApp: false },
] }] as any

const catsWithLaunchLink = [{ categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [
  { id: 5, nameZh: 'MES客户端', nameEn: 'MES Client', url: 'mesclient://launch', icon: 'factory', statusCode: 'ACTIVE', openInNewTab: false, launchApp: true, downloadUrl: 'https://download.example.com' },
] }] as any

describe('SystemGrid', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh'; setActivePinia(createPinia()) })
  afterEach(() => { vi.restoreAllMocks() })
  it('renders link cards with localized name + href/target + status', () => {
    const w = mount(SystemGrid, { props: { categories: cats }, global: { plugins: [i18n] } })
    expect(w.text()).toContain('在制品管理')
    const a = w.findAll('a')
    expect(a[0].attributes('href')).toBe('https://x'); expect(a[0].attributes('target')).toBe('_blank')
    expect(w.findAll('svg').length).toBeGreaterThanOrEqual(2)
  })
  it('link with environment renders colored badge; link without environment has no badge', () => {
    const w = mount(SystemGrid, { props: { categories: catsWithEnv }, global: { plugins: [i18n] } })
    // ProdSys has no environment → no badge for that card
    const cards = w.findAll('a')
    const devCard = cards.find((a) => a.text().includes('开发系统'))!
    expect(devCard.text()).toContain('DEV')
    const prodCard = cards.find((a) => a.text().includes('生产系统'))!
    expect(prodCard.text()).not.toContain('DEV')
    expect(prodCard.text()).not.toContain('UAT')
    expect(prodCard.text()).not.toContain('RELEASE')
  })
  it('点击已停用系统弹出警告(拦截直接打开)', async () => {
    const w = mount(SystemGrid, { props: { categories: cats }, global: { plugins: [i18n] }, attachTo: document.body })
    await w.findAll('a')[1].trigger('click')   // old (DEPRECATED)
    await flushPromises()
    expect(document.body.textContent).toContain('已停用')
    const proceed = [...document.body.querySelectorAll('button')].find((b) => /仍要打开/.test(b.textContent || ''))
    expect(proceed).toBeTruthy()
    w.unmount(); document.body.innerHTML = ''
  })
  it('launch link: href 指向 downloadUrl;渲染 APP 徽章', () => {
    const w = mount(SystemGrid, { props: { categories: catsWithLaunchLink }, global: { plugins: [i18n] } })
    const a = w.find('a')
    expect(a.attributes('href')).toBe('https://download.example.com')
    expect(w.text()).toContain('APP')
  })
  it('launch link: 点击调 launchOrDownload(不跟随 href)', async () => {
    const launchMod = await import('@/lib/composables/useAppLaunch')
    const launchSpy = vi.spyOn(launchMod, 'launchOrDownload').mockImplementation(() => {})
    const w = mount(SystemGrid, { props: { categories: catsWithLaunchLink }, global: { plugins: [i18n] } })
    await w.find('a').trigger('click')
    expect(launchSpy).toHaveBeenCalledWith('mesclient://launch', 'https://download.example.com')
  })
})
