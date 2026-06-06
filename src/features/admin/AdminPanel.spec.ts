import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import AdminPanel from './AdminPanel.vue'

describe('AdminPanel', () => {
  it('renders title + actions/toolbar/body/footer slots', () => {
    const w = mount(AdminPanel, {
      props: { title: '链接管理' },
      slots: {
        default: () => h('div', '正文X'),
        actions: () => h('button', '新建'),
        toolbar: () => h('div', '工具栏'),
        footer: () => h('div', '分页F'),
      },
    })
    const t = w.text()
    expect(t).toContain('链接管理')
    expect(t).toContain('正文X')
    expect(t).toContain('新建')
    expect(t).toContain('工具栏')
    expect(t).toContain('分页F')
  })
  it('omits actions/toolbar/footer strips when no slot given', () => {
    const w = mount(AdminPanel, { props: { title: 'T' }, slots: { default: () => h('div', 'body') } })
    expect(w.text()).toContain('T')
    expect(w.text()).toContain('body')
  })
})
