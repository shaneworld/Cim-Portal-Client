import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import Modal from './Modal.vue'

describe('Modal', () => {
  it('open 时渲染标题与内容到 body;关闭时不渲染', async () => {
    const w = mount(Modal, { props: { open: true, title: '编辑' }, slots: { default: () => h('p', '内容X') }, attachTo: document.body })
    expect(document.body.textContent).toContain('编辑')
    expect(document.body.textContent).toContain('内容X')
    await w.setProps({ open: false })
    expect(document.body.textContent).not.toContain('内容X')
    w.unmount()
  })
  it('内容卡片无缩放/位移弹出类(仅淡入)', () => {
    const w = mount(Modal, { props: { open: true, title: 't' }, attachTo: document.body })
    const content = document.querySelector('[data-testid="modal-content"]')!
    expect(content.className).not.toMatch(/scale|translate|slide/)
    w.unmount(); document.body.innerHTML = ''
  })
  it('size=xl 时内联样式含 min(92vw, 60rem)', () => {
    const w = mount(Modal, { props: { open: true, size: 'xl' }, attachTo: document.body })
    const content = document.body.querySelector('[data-testid="modal-content"]') as HTMLElement
    expect(content.style.width).toBe('min(92vw, 60rem)')
    w.unmount(); document.body.innerHTML = ''
  })
  it('默认 size(md) 时内联样式含 min(92vw, 36rem)', () => {
    const w = mount(Modal, { props: { open: true } }, )
    // Use component's computed directly since portal may not attach without document.body
    const vm = w.vm as unknown as { contentStyle: { width: string } }
    expect(vm.contentStyle.width).toBe('min(92vw, 36rem)')
    w.unmount()
  })
  it('size=sm 时内联样式含 min(92vw, 28rem)', () => {
    const w = mount(Modal, { props: { open: true, size: 'sm' } })
    const vm = w.vm as unknown as { contentStyle: { width: string } }
    expect(vm.contentStyle.width).toBe('min(92vw, 28rem)')
    w.unmount()
  })
  it('size=lg 时内联样式含 min(92vw, 48rem)', () => {
    const w = mount(Modal, { props: { open: true, size: 'lg' } })
    const vm = w.vm as unknown as { contentStyle: { width: string } }
    expect(vm.contentStyle.width).toBe('min(92vw, 48rem)')
    w.unmount()
  })
})
