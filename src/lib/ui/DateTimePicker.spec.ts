import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
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
})
