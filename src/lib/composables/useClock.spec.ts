import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useClock } from './useClock'
const Host = defineComponent({ setup() { const { time, weekday } = useClock(); return () => h('div', `${time.value}|${weekday.value}`) } })
afterEach(() => vi.useRealTimers())
describe('useClock', () => {
  it('renders HH:MM:SS, ticks, cleans up', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 0, 2, 9, 8, 7))
    const w = mount(Host)
    expect(w.text()).toMatch(/^09:08:07\|周五/)
    const spy = vi.spyOn(globalThis, 'clearInterval'); w.unmount(); expect(spy).toHaveBeenCalled()
  })
})
