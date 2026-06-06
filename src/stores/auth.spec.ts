import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { useAuthStore } from './auth'

const BASE = 'http://localhost:8080'
describe('auth store', () => {
  beforeEach(() => { setActivePinia(createPinia()); localStorage.clear(); configureClient({ baseUrl: BASE, getToken: () => null, getLocale: () => 'zh', onUnauthorized: () => {} }) })
  it('login stores token + hydrates user; isAdmin reflects me', async () => {
    server.use(
      http.post(`${BASE}/dev/token`, () => HttpResponse.json({ token: 'jwt-admin' })),
      http.get(`${BASE}/api/portal/me`, () => HttpResponse.json({ employeeId: 'ADMIN1', displayNameZh: '亚当', displayNameEn: 'Adam', departmentCode: 'IT', roleCode: 'PORTAL_ADMIN', isAdmin: true })),
    )
    const a = useAuthStore()
    await a.login('ADMIN1')
    expect(a.token).toBe('jwt-admin')
    expect(a.currentUser?.employeeId).toBe('ADMIN1')
    expect(a.isAdmin).toBe(true)
    expect(localStorage.getItem('cimp.token')).toBe('jwt-admin')
  })
})
