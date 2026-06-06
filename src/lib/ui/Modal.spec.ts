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
})
