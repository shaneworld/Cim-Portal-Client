import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes, installGuards } from './index'
import { useAuthStore } from '@/stores/auth'

describe('router guards', () => {
  beforeEach(() => { setActivePinia(createPinia()); localStorage.clear() })
  it('redirects unauthenticated users to /login', async () => {
    const r = createRouter({ history: createMemoryHistory(), routes }); installGuards(r)
    await r.push('/'); await r.isReady()
    expect(r.currentRoute.value.path).toBe('/login')
  })
  it('blocks /admin for non-admins', async () => {
    const r = createRouter({ history: createMemoryHistory(), routes }); installGuards(r)
    const a = useAuthStore(); a.setToken('t'); a.currentUser = { employeeId: 'OP1', displayNameZh: '', displayNameEn: '', departmentCode: '', roleCode: '', isAdmin: false } as any
    await r.push('/admin'); await r.isReady()
    expect(r.currentRoute.value.path).toBe('/')
  })
})
