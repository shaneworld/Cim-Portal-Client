import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import DateTimePicker from './DateTimePicker.vue'

describe('DateTimePicker', () => {
  it('renders trigger with placeholder when empty', () => {
    const w = mount(DateTimePicker, { props: { modelValue: '', placeholder: '选择时间' } })
    expect(w.text()).toContain('选择时间')
  })
  it('shows the bound value in the trigger', () => {
    const w = mount(DateTimePicker, { props: { modelValue: '2026-06-12T09:30' } })
    expect(w.text()).toContain('2026')
    expect(w.text()).toContain('09:30')
  })
  it('emits empty string when cleared', async () => {
    const w = mount(DateTimePicker, { props: { modelValue: '2026-06-12T09:30', clearable: true } })
    await w.find('[data-testid="dtp-clear"]').trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([''])
  })

  it('emits correct YYYY-MM-DDTHH:MM when a day is clicked (preserving bound hour/min)', async () => {
    const w = mount(DateTimePicker, {
      props: { modelValue: '2026-06-12T09:30' },
      attachTo: document.body,
    })
    // Open the popover via the main trigger button (not the clear X).
    await w.find('button').trigger('click')
    await nextTick()
    await flushPromises()

    // PopoverPortal renders to document.body; wait for the day grid to mount.
    let dayBtn: HTMLButtonElement | undefined
    await vi.waitFor(() => {
      dayBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === '5',
      ) as HTMLButtonElement | undefined
      expect(dayBtn).toBeTruthy()
    })

    dayBtn!.click()
    await nextTick()

    expect(w.emitted('update:modelValue')?.at(-1)).toEqual(['2026-06-05T09:30'])
    w.unmount()
  })

  it('"Now" emits a valid local YYYY-MM-DDTHH:MM pattern', async () => {
    const w = mount(DateTimePicker, {
      props: { modelValue: '2026-06-12T09:30' },
      attachTo: document.body,
    })
    await w.find('button').trigger('click')
    await nextTick()
    await flushPromises()

    let nowBtn: HTMLButtonElement | undefined
    await vi.waitFor(() => {
      nowBtn = document.querySelector('[data-testid="dtp-now"]') as HTMLButtonElement | null ?? undefined
      expect(nowBtn).toBeTruthy()
    })

    nowBtn!.click()
    await nextTick()

    const last = w.emitted('update:modelValue')?.at(-1)?.[0] as string
    expect(last).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    w.unmount()
  })
})
