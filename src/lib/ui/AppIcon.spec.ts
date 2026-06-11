import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppIcon from './AppIcon.vue'

describe('AppIcon', () => {
  it('renders a lucide svg for a known name', () => {
    expect(mount(AppIcon, { props: { name: 'factory' } }).find('svg').exists()).toBe(true)
  })

  it('renders the fallback svg for an unknown name', () => {
    expect(mount(AppIcon, { props: { name: 'zzz' } }).find('svg').exists()).toBe(true)
  })

  it('renders an img whose src ends with /api/icons/1 for upload:1', () => {
    const wrapper = mount(AppIcon, { props: { name: 'upload:1' } })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toMatch(/\/api\/icons\/1$/)
  })

  it('renders svg (no img) for a built-in icon name', () => {
    const wrapper = mount(AppIcon, { props: { name: 'factory' } })
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.find('img').exists()).toBe(false)
  })
})
