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
})
