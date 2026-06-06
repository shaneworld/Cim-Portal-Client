import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { configureClient } from './client'
import { getHome, getMe } from './portal'
import { getLabels } from './i18n'
import { listEnum } from './enums'

const BASE = 'http://localhost:8080'
beforeEach(() => configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} }))

describe('portal api', () => {
  it('getHome / getMe / getLabels / listEnum hit the right paths', async () => {
    server.use(
      http.get(`${BASE}/api/portal/home`, () => HttpResponse.json({ categories: [] })),
      http.get(`${BASE}/api/portal/me`, () => HttpResponse.json({ employeeId: 'OP1', displayNameZh: '欧', displayNameEn: 'O', departmentCode: 'FAB1-PROD', roleCode: 'OPERATOR', isAdmin: false })),
      http.get(`${BASE}/api/i18n/labels`, () => HttpResponse.json({ 'nav.admin': { zh: '管理', en: 'Admin', type: 'UI_TEXT' } })),
      http.get(`${BASE}/api/enums/DEPARTMENT`, () => HttpResponse.json([{ id: 1, category: 'DEPARTMENT', code: 'IT', labelZh: '信息', labelEn: 'IT', sortOrder: 1, active: true }])),
    )
    expect((await getHome()).categories).toEqual([])
    expect((await getMe()).employeeId).toBe('OP1')
    expect((await getLabels())['nav.admin'].zh).toBe('管理')
    expect((await listEnum('DEPARTMENT'))[0].code).toBe('IT')
  })
})
