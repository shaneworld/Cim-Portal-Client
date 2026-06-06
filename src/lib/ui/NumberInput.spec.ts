import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NumberInput from './NumberInput.vue'

describe('NumberInput', () => {
  it('steppers inc/dec emit; typing emits number', async () => {
    const w = mount(NumberInput, { props: { modelValue: 5 } })
    const btns = w.findAll('button')
    await btns[0].trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([6])
    await btns[1].trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([4])
    await w.get('input').setValue('12')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([12])
  })
  it('clamps at min (default 0)', async () => {
    const w = mount(NumberInput, { props: { modelValue: 0 } })
    await w.findAll('button')[1].trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([0])
  })
  it('forwards data-testid to the inner input', () => {
    const w = mount(NumberInput, { props: { modelValue: 1 }, attrs: { 'data-testid': 'f-sortOrder' } })
    expect(w.get('[data-testid="f-sortOrder"]').element.tagName).toBe('INPUT')
  })
})
