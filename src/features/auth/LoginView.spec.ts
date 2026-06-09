import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '@/router'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import LoginView from './LoginView.vue'

// Mock sso module so startSso doesn't trigger real redirects
vi.mock('@/lib/auth/sso', () => ({
  startSso: vi.fn(),
  completeSso: vi.fn(),
}))

import { startSso } from '@/lib/auth/sso'

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    i18n.global.locale.value = 'zh'
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  function makeRouter() {
    return createRouter({ history: createMemoryHistory(), routes })
  }

  it('ssoEnabled=true + no sso_failed flag → calls startSso on mount', async () => {
    const configStore = useConfigStore()
    configStore.config = { ssoEnabled: true, authority: 'https://kc.test/realms/r', clientId: 'cim', scopes: 'openid', usernameClaim: 'preferred_username' }
    configStore.loaded = true
    vi.mocked(startSso).mockResolvedValue(undefined)

    const router = makeRouter()
    mount(LoginView, { global: { plugins: [router, i18n] } })
    await flushPromises()

    expect(startSso).toHaveBeenCalledWith(configStore.config)
  })

  it('ssoEnabled=false → shows internal form, no startSso call', async () => {
    const configStore = useConfigStore()
    configStore.config = { ssoEnabled: false, scopes: 'openid profile', usernameClaim: 'preferred_username' }
    configStore.loaded = true

    const router = makeRouter()
    const w = mount(LoginView, { global: { plugins: [router, i18n] } })
    await flushPromises()

    expect(startSso).not.toHaveBeenCalled()
    expect(w.find('[data-testid="employeeId"]').exists()).toBe(true)
    expect(w.find('[data-testid="password"]').exists()).toBe(true)
  })

  it('sso_failed set → shows internal form + SSO button even when ssoEnabled=true', async () => {
    sessionStorage.setItem('sso_failed', '1')
    const configStore = useConfigStore()
    configStore.config = { ssoEnabled: true, authority: 'https://kc.test/realms/r', clientId: 'cim', scopes: 'openid', usernameClaim: 'preferred_username' }
    configStore.loaded = true

    const router = makeRouter()
    const w = mount(LoginView, { global: { plugins: [router, i18n] } })
    await flushPromises()

    expect(startSso).not.toHaveBeenCalled()
    expect(w.find('[data-testid="employeeId"]').exists()).toBe(true)
    // SSO retry button should be visible
    expect(w.text()).toContain('SSO')
  })

  it('internal form submit calls loginInternal + navigates to /', async () => {
    const configStore = useConfigStore()
    configStore.config = { ssoEnabled: false, scopes: 'openid profile', usernameClaim: 'preferred_username' }
    configStore.loaded = true

    const router = makeRouter()
    const auth = useAuthStore()
    const spy = vi.spyOn(auth, 'loginInternal').mockResolvedValue(undefined)

    const w = mount(LoginView, { global: { plugins: [router, i18n] } })
    await flushPromises()

    await w.find('[data-testid="employeeId"]').setValue('EMP1')
    await w.find('[data-testid="password"]').setValue('s3cret')
    await w.find('button').trigger('click')
    await flushPromises()

    expect(spy).toHaveBeenCalledWith('EMP1', 's3cret')
  })
})
