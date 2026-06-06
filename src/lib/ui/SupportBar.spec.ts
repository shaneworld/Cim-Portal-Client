import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SupportBar from './SupportBar.vue'

describe('SupportBar', () => {
  it('renders the support number as an in-flow footer (not fixed), with no glass panel', () => {
    const w = mount(SupportBar)
    expect(w.text()).toContain('39100')
    expect(w.find('footer').exists()).toBe(true)
    expect(w.find('footer').classes()).not.toContain('fixed')
    expect(w.find('.glass').exists()).toBe(false)
  })
})
