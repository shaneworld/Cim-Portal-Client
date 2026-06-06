import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from './ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('open 显示消息;点删除 emit confirm', async () => {
    const w = mount(ConfirmDialog, { props: { open: true, title: '删除?', message: '确认删除链接' }, attachTo: document.body })
    expect(document.body.textContent).toContain('确认删除链接')
    const btns = [...document.querySelectorAll('button')]
    const confirm = btns.find((b) => /删除/.test(b.textContent || ''))!
    confirm.click()
    expect(w.emitted('confirm')).toBeTruthy()
    w.unmount(); document.body.innerHTML = ''
  })
})
