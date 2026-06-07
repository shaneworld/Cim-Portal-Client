import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/lib/i18n'
import SupportBar from './SupportBar.vue'

describe('SupportBar', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh' })
  it('renders the support number as an in-flow footer (not fixed), with no glass panel', () => {
    const w = mount(SupportBar, { global: { plugins: [i18n] } })
    expect(w.text()).toContain('39100')
    expect(w.find('footer').exists()).toBe(true)
    expect(w.find('footer').classes()).not.toContain('fixed')
    expect(w.find('.glass').exists()).toBe(false)
  })
})
