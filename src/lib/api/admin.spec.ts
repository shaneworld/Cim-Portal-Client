import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from '@/lib/api/client'
import { listLinks, getLink, createLink, updateLink, deleteLink, replaceGrants, listEnumValues, createEnumValue, updateEnumValue, deleteEnumValue } from './admin'

const BASE = 'http://localhost:8080'
beforeEach(() => configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }))

describe('admin api', () => {
  it('listLinks GET /api/admin/links', async () => {
    server.use(http.get(`${BASE}/api/admin/links`, () => HttpResponse.json([{ id: 1, nameZh: '甲', nameEn: 'A', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [] }])))
    const r = await listLinks(); expect(r[0].nameZh).toBe('甲'); expect(Array.isArray(r[0].grants)).toBe(true)
  })
  it('getLink GET /{id} (detail includes grants)', async () => {
    server.use(http.get(`${BASE}/api/admin/links/1`, () => HttpResponse.json({ id: 1, nameZh: '甲', nameEn: 'A', url: 'u', icon: 'factory', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 1, openInNewTab: true, grants: [{ id: 7, linkId: 1, grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }] })))
    const r = await getLink(1); expect(r.grants[0].grantCode).toBe('FAB1-PROD')
  })
  it('createLink POST (plain url, no environment)', async () => {
    let body: any
    server.use(http.post(`${BASE}/api/admin/links`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ id: 9, ...body, grants: [] }) }))
    const r = await createLink({ nameZh: '乙', nameEn: 'X', url: 'u', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false, launchApp: false })
    expect(r.id).toBe(9); expect(body.url).toBe('u'); expect(body.environment).toBeUndefined()
  })
  it('createLink POST with environment', async () => {
    let body: any
    server.use(http.post(`${BASE}/api/admin/links`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ id: 10, ...body, grants: [] }) }))
    const r = await createLink({ nameZh: '丙', nameEn: 'Y', url: 'https://uat.example.com', environment: 'UAT', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false, launchApp: false })
    expect(r.id).toBe(10); expect(body.url).toBe('https://uat.example.com'); expect(body.environment).toBe('UAT')
  })
  it('updateLink PUT /{id} and deleteLink DELETE /{id}', async () => {
    server.use(http.put(`${BASE}/api/admin/links/9`, () => HttpResponse.json({ id: 9, nameZh: '乙', nameEn: 'X', url: 'u', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false, grants: [] })))
    server.use(http.delete(`${BASE}/api/admin/links/9`, () => new HttpResponse(null, { status: 204 })))
    expect((await updateLink(9, { nameZh: '乙', nameEn: 'X', url: 'u', icon: 'book', categoryCode: 'MES', statusCode: 'ACTIVE', sortOrder: 5, openInNewTab: false, launchApp: false })).id).toBe(9)
    await expect(deleteLink(9)).resolves.toBeUndefined()
  })
  it('replaceGrants PUT /{id}/grants with {grants}', async () => {
    let body: any
    server.use(http.put(`${BASE}/api/admin/links/9/grants`, async ({ request }) => { body = await request.json(); return HttpResponse.json([{ id: 1, linkId: 9, grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }]) }))
    const r = await replaceGrants(9, [{ grantType: 'DEPARTMENT', grantCode: 'FAB1-PROD' }])
    expect(body.grants[0].grantCode).toBe('FAB1-PROD'); expect(r[0].grantType).toBe('DEPARTMENT')
  })
  it('enum CRUD 命中 /api/admin/enums/{category}[/id]', async () => {
    server.use(http.get(`${BASE}/api/admin/enums/DEPARTMENT`, () => HttpResponse.json([{ id: 1, category: 'DEPARTMENT', code: 'IT', labelZh: '信息', labelEn: 'IT', sortOrder: 10, active: true }])))
    let postBody: any, putBody: any, del = false
    server.use(http.post(`${BASE}/api/admin/enums/ROLE`, async ({ request }) => { postBody = await request.json(); return HttpResponse.json({ id: 5, category: 'ROLE', ...postBody }) }))
    server.use(http.put(`${BASE}/api/admin/enums/ROLE/5`, async ({ request }) => { putBody = await request.json(); return HttpResponse.json({ id: 5, category: 'ROLE', ...putBody }) }))
    server.use(http.delete(`${BASE}/api/admin/enums/ROLE/5`, () => { del = true; return new HttpResponse(null, { status: 204 }) }))
    expect((await listEnumValues('DEPARTMENT'))[0].code).toBe('IT')
    const c = await createEnumValue('ROLE', { code: 'OP', labelZh: '操作', labelEn: 'Op', sortOrder: 10, active: true })
    expect(c.id).toBe(5); expect(postBody.code).toBe('OP')
    await updateEnumValue('ROLE', 5, { code: 'OP', labelZh: '操作员', labelEn: 'Operator', sortOrder: 10, active: false })
    expect(putBody.active).toBe(false)
    await deleteEnumValue('ROLE', 5); expect(del).toBe(true)
  })
})
