import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import AnnouncementsAdminView from './AnnouncementsAdminView.vue'

const BASE = 'http://localhost:8080'
const ITEMS = [
  {
    id: 1, titleZh: 'ActiveOne', titleEn: 'ActiveOne', bodyZh: '', bodyEn: '',
    typeCode: 'INFO', typeLabelZh: '信息', typeLabelEn: 'Info', typeColor: 'blue', typeIcon: 'info',
    pinned: false, active: true, closedAt: null, createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 2, titleZh: 'ClosedOne', titleEn: 'ClosedOne', bodyZh: '', bodyEn: '',
    typeCode: 'INFO', typeLabelZh: '信息', typeLabelEn: 'Info', typeColor: 'blue', typeIcon: 'info',
    pinned: false, active: false, closedAt: '2026-06-12T00:00:00Z', createdAt: '2026-06-01T00:00:00Z',
  },
]

beforeEach(() => {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'en'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'en', onUnauthorized: () => {} })
  server.use(http.get(`${BASE}/api/admin/announcements`, () => HttpResponse.json(ITEMS)))
})

describe('AnnouncementsAdminView', () => {
  it('默认 Active 标签:显示 active 项,隐藏 history 项', async () => {
    const w = mount(AnnouncementsAdminView, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(w.text()).toContain('ActiveOne')
    expect(w.text()).not.toContain('ClosedOne')
  })

  it('切到 History 标签:显示已关闭项 + 到期标记,隐藏 active 项', async () => {
    const w = mount(AnnouncementsAdminView, { global: { plugins: [i18n] } })
    await flushPromises()
    await w.get('[data-testid="ann-tab-history"]').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('ClosedOne')
    expect(w.text()).toContain('Expired')
    expect(w.text()).not.toContain('ActiveOne')
  })
})
