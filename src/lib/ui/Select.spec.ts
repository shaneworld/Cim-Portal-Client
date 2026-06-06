import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Select from './Select.vue'
import Switch from './Switch.vue'

describe('Select', () => {
  it('渲染当前选中项的 label;无值显示 placeholder', () => {
    const w = mount(Select, { props: { modelValue: 'MES', options: [{ value: 'MES', label: '制造' }, { value: 'QA', label: '质量' }], placeholder: '选择' }, attachTo: document.body })
    expect(w.text()).toContain('制造')
    w.unmount()
  })
})
describe('Switch', () => {
  it('点击切换 emit update:modelValue', async () => {
    const w = mount(Switch, { props: { modelValue: false } })
    await w.find('button').trigger('click')
    expect(w.emitted('update:modelValue')?.at(-1)).toEqual([true])
  })
})
