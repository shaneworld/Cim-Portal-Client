import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import { useConfigStore } from '@/stores/config'
import SupportBar from './SupportBar.vue'

describe('SupportBar', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh'; setActivePinia(createPinia()) })

  it('renders the support number as an in-flow footer (not fixed), with no glass panel', () => {
    const w = mount(SupportBar, { global: { plugins: [i18n] } })
    expect(w.text()).toContain('39100')
    expect(w.find('footer').exists()).toBe(true)
    expect(w.find('footer').classes()).not.toContain('fixed')
    expect(w.find('.glass').exists()).toBe(false)
  })

  it('shows the feedback link when larkEnabled is true', () => {
    const cfg = useConfigStore()
    cfg.config = { ...cfg.config, larkEnabled: true }
    const w = mount(SupportBar, { global: { plugins: [i18n] } })
    expect(w.find('[data-testid="fb-link"]').exists()).toBe(true)
  })

  it('hides the feedback link when larkEnabled is false', () => {
    const cfg = useConfigStore()
    cfg.config = { ...cfg.config, larkEnabled: false }
    const w = mount(SupportBar, { global: { plugins: [i18n] } })
    expect(w.find('[data-testid="fb-link"]').exists()).toBe(false)
  })
})
