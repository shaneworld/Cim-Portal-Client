import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { listLinks, getLink, createLink, updateLink, deleteLink, replaceGrants } from './admin'

const BASE = 'http://localhost:8080'
beforeEach(() => configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }))

describe('admin api', () => {
  it('listLinks GET /api/admin/links', async () => {
    server.use(http.get(`${BASE}/api/admin/links`, () => HttpResponse.json([{ id: 1, code: 'a', nameZh: '甲', nameEn: 'A', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [] }])))
    const r = await listLinks(); expect(r[0].code).toBe('a'); expect(Array.isArray(r[0].grants)).toBe(true)
  })
  it('getLink GET /{id} (detail includes grants)', async () => {
    server.use(http.get(`${BASE}/api/admin/links/1`, () => HttpResponse.json({ id: 1, code: 'a', nameZh: '甲', nameEn: 'A', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [{ id: 7, linkId: 1, grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }] })))
    const r = await getLink(1); expect(r.grants[0].grantCode).toBe('FAB1-PROD')
  })
  it('createLink POST', async () => {
    let body: any
    server.use(http.post(`${BASE}/api/admin/links`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ id: 9, ...body, grants: [] }) }))
    const r = await createLink({ code: 'x', nameZh: '乙', nameEn: 'X', url: 'u', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false })
    expect(r.id).toBe(9); expect(body.code).toBe('x')
  })
  it('updateLink PUT /{id} and deleteLink DELETE /{id}', async () => {
    server.use(http.put(`${BASE}/api/admin/links/9`, () => HttpResponse.json({ id: 9, code: 'x', nameZh: '乙', nameEn: 'X', url: 'u', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false, grants: [] })))
    server.use(http.delete(`${BASE}/api/admin/links/9`, () => new HttpResponse(null, { status: 204 })))
    expect((await updateLink(9, { code: 'x', nameZh: '乙', nameEn: 'X', url: 'u', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false })).id).toBe(9)
    await expect(deleteLink(9)).resolves.toBeUndefined()
  })
  it('replaceGrants PUT /{id}/grants with {grants}', async () => {
    let body: any
    server.use(http.put(`${BASE}/api/admin/links/9/grants`, async ({ request }) => { body = await request.json(); return HttpResponse.json([{ id: 1, linkId: 9, grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }]) }))
    const r = await replaceGrants(9, [{ grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }])
    expect(body.grants[0].grantCode).toBe('FAB1-PROD'); expect(r[0].grantType).toBe('DEPARTMENT')
  })
})
