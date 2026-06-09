import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '@/router'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import { useConfigStore } from '@/stores/config'
import CallbackView from './CallbackView.vue'

vi.mock('@/lib/auth/sso', () => ({
  startSso: vi.fn(),
  completeSso: vi.fn(),
}))

import { completeSso } from '@/lib/auth/sso'

describe('CallbackView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  function makeRouter() {
    return createRouter({ history: createMemoryHistory(), routes })
  }

  it('success: stores token, calls hydrateUser, replaces route to /', async () => {
    const configStore = useConfigStore()
    configStore.config = { ssoEnabled: true, authority: 'https://kc.test/realms/r', clientId: 'cim', scopes: 'openid', usernameClaim: 'preferred_username' }
    vi.mocked(completeSso).mockResolvedValue('sso-jwt')

    const router = makeRouter()
    const replaceSpy = vi.spyOn(router, 'replace')
    const auth = useAuthStore()
    vi.spyOn(auth, 'hydrateUser').mockResolvedValue(undefined)
    const setTokenSpy = vi.spyOn(auth, 'setToken')

    await router.push('/auth/callback')
    mount(CallbackView, { global: { plugins: [router, i18n] } })
    await flushPromises()

    expect(setTokenSpy).toHaveBeenCalledWith('sso-jwt')
    expect(auth.hydrateUser).toHaveBeenCalled()
    expect(replaceSpy).toHaveBeenCalledWith('/')
  })

  it('failure: sets sso_attempted flag and replaces route to /login', async () => {
    const configStore = useConfigStore()
    configStore.config = { ssoEnabled: true, authority: 'https://kc.test/realms/r', clientId: 'cim', scopes: 'openid', usernameClaim: 'preferred_username' }
    vi.mocked(completeSso).mockRejectedValue(new Error('callback error'))

    const router = makeRouter()
    const replaceSpy = vi.spyOn(router, 'replace')

    await router.push('/auth/callback')
    mount(CallbackView, { global: { plugins: [router, i18n] } })
    await flushPromises()

    expect(sessionStorage.getItem('sso_attempted')).toBe('1')
    expect(replaceSpy).toHaveBeenCalledWith('/login')
  })
})
