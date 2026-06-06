import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { DEV_IDENTITIES, createDevAuth } from './devAuth'

const BASE = 'http://localhost:8080'
beforeEach(() => configureClient({ baseUrl: BASE, getToken: () => null, getLocale: () => 'zh', onUnauthorized: () => {} }))

describe('devAuth', () => {
  it('lists dev identities including ADMIN1', () => {
    expect(DEV_IDENTITIES.some((i) => i.employeeId === 'ADMIN1')).toBe(true)
  })
  it('login posts the employeeId to /dev/token and returns the token', async () => {
    server.use(http.post(`${BASE}/dev/token`, async ({ request }) => {
      expect((await request.json() as any).employeeId).toBe('OP1')
      return HttpResponse.json({ token: 'jwt-op1' })
    }))
    expect(await createDevAuth().login('OP1')).toBe('jwt-op1')
  })
})
