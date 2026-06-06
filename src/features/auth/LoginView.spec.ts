import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '@/router'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import LoginView from './LoginView.vue'

describe('LoginView', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  it('lists dev identities and logs in on click', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const auth = useAuthStore()
    const spy = vi.spyOn(auth, 'login').mockResolvedValue(undefined as any)
    const w = mount(LoginView, { global: { plugins: [router, i18n] } })
    expect(w.text()).toContain('ADMIN1')
    const btn = w.findAll('button').find((b) => b.text().includes('ADMIN1'))!
    await btn.trigger('click'); await flushPromises()
    expect(spy).toHaveBeenCalledWith('ADMIN1')
  })
})
