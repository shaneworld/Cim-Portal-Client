import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import GlassCard from './GlassCard.vue'
import Button from './Button.vue'
import Input from './Input.vue'
import StatusDot from './StatusDot.vue'
import Toaster from './Toaster.vue'
import { useToastStore } from '@/stores/toast'

describe('ui primitives', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('GlassCard renders slot with .glass', () => {
    const w = mount(GlassCard, { slots: { default: '内容' } })
    expect(w.text()).toContain('内容'); expect(w.classes()).toContain('glass')
  })
  it('Button emits click', async () => { const w = mount(Button, { slots: { default: 'OK' } }); await w.trigger('click'); expect(w.emitted('click')).toBeTruthy() })
  it('Input binds v-model', async () => { const w = mount(Input, { props: { modelValue: '' } }); await w.get('input').setValue('x'); expect(w.emitted('update:modelValue')?.[0]).toEqual(['x']) })
  it('StatusDot maps statusCode to a color', () => {
    expect(mount(StatusDot, { props: { status: 'ACTIVE' } }).html()).toMatch(/--go|142/i)
  })
  it('Toaster renders pushed toasts', async () => {
    const w = mount(Toaster); useToastStore().push({ type: 'success', message: '已保存' })
    await w.vm.$nextTick(); expect(w.text()).toContain('已保存')
  })
})
