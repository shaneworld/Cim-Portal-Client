import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { i18n } from '@/lib/i18n'
import AdminLayout from './AdminLayout.vue'

describe('AdminLayout', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  it('渲染导航(链接)+ 返回门户', () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/admin/links', component: { template: '<div>LINKS</div>' } },
    ] })
    const w = mount(AdminLayout, { global: { plugins: [router, i18n] } })
    expect(w.text()).toContain('链接')
    expect(w.text()).toMatch(/返回门户|门户/)
    expect(w.findAll('a').length).toBeGreaterThanOrEqual(2)
  })
})
