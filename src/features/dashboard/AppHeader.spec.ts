import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '@/router'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import AppHeader from './AppHeader.vue'

function mountHeader() {
  const router = createRouter({ history: createMemoryHistory(), routes })
  return mount(AppHeader, { global: { plugins: [router, i18n] } })
}

function setAdmin(isAdmin: boolean) {
  const auth = useAuthStore()
  auth.currentUser = { employeeId: 'ADMIN1', displayNameZh: '亚当', displayNameEn: 'Adam', departmentCode: 'IT', roleCode: 'PORTAL_ADMIN', isAdmin } as any
}

describe('AppHeader', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  afterEach(() => { vi.unstubAllEnvs() })

  it('shows the admin link only for admins; shows user name', async () => {
    setAdmin(true)
    const w = mountHeader()
    expect(w.text()).toContain('亚当')
    expect(w.text()).toContain('管理')
  })

  it('admin + both env set → renders both architecture and API links opening in a new tab', () => {
    vi.stubEnv('VITE_ARCH_URL', 'http://x/arch')
    vi.stubEnv('VITE_SWAGGER_URL', 'http://x/swagger')
    setAdmin(true)
    const w = mountHeader()
    const arch = w.get('[data-testid="header-arch-link"]')
    expect(arch.attributes('href')).toBe('http://x/arch')
    expect(arch.attributes('target')).toBe('_blank')
    expect(arch.attributes('rel')).toBe('noopener noreferrer')
    const api = w.get('[data-testid="header-api-link"]')
    expect(api.attributes('href')).toBe('http://x/swagger')
    expect(api.attributes('target')).toBe('_blank')
    expect(api.attributes('rel')).toBe('noopener noreferrer')
  })

  it('not admin + env set → renders neither link', () => {
    vi.stubEnv('VITE_ARCH_URL', 'http://x/arch')
    vi.stubEnv('VITE_SWAGGER_URL', 'http://x/swagger')
    setAdmin(false)
    const w = mountHeader()
    expect(w.find('[data-testid="header-arch-link"]').exists()).toBe(false)
    expect(w.find('[data-testid="header-api-link"]').exists()).toBe(false)
  })

  it('admin + env unset → renders neither link', () => {
    vi.stubEnv('VITE_ARCH_URL', '')
    vi.stubEnv('VITE_SWAGGER_URL', '')
    setAdmin(true)
    const w = mountHeader()
    expect(w.find('[data-testid="header-arch-link"]').exists()).toBe(false)
    expect(w.find('[data-testid="header-api-link"]').exists()).toBe(false)
  })
})
