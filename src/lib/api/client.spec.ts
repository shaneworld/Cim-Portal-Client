import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { request, configureClient, ApiError } from './client'

const BASE = 'http://localhost:8080'
beforeEach(() => configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }))

describe('api client', () => {
  it('sends auth + locale headers and returns json', async () => {
    server.use(http.get(`${BASE}/api/ping`, ({ request }) => {
      expect(request.headers.get('Authorization')).toBe('Bearer t')
      expect(request.headers.get('Accept-Language')).toBe('zh')
      return HttpResponse.json({ ok: true })
    }))
    expect(await request<{ ok: boolean }>('GET', '/api/ping')).toEqual({ ok: true })
  })
  it('throws ApiError with code on non-2xx', async () => {
    server.use(http.get(`${BASE}/api/x`, () => HttpResponse.json({ timestamp: '', status: 409, error: 'Conflict', code: 'DUPLICATE_CODE', message: 'dup', path: '/x', fieldErrors: [{ field: 'code', message: 'taken' }] }, { status: 409 })))
    const e = (await request('GET', '/api/x').catch((err) => err)) as ApiError
    expect(e).toBeInstanceOf(ApiError)
    expect(e.code).toBe('DUPLICATE_CODE'); expect(e.fieldErrors[0].field).toBe('code')
  })
  it('returns undefined on 204', async () => {
    server.use(http.delete(`${BASE}/api/x`, () => new HttpResponse(null, { status: 204 })))
    expect(await request('DELETE', '/api/x')).toBeUndefined()
  })
})
