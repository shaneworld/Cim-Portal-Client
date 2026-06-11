import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import { useConfigStore } from '@/stores/config'
import AnnouncementsPanel from './AnnouncementsPanel.vue'

const BASE = 'http://localhost:8080'

const ANN_1 = {
  id: 1, titleZh: '计划停机', titleEn: 'Planned Downtime',
  bodyZh: '明日凌晨维护', bodyEn: 'Maintenance tomorrow',
  typeCode: 'NOTICE', typeLabelZh: '通知', typeLabelEn: 'Notice',
  typeColor: 'blue', typeIcon: 'bell',
  pinned: false, startsAt: null, endsAt: null, active: true, createdAt: '2026-01-01T00:00:00Z',
}
const ANN_2 = {
  id: 2, titleZh: '紧急公告', titleEn: 'Urgent Alert',
  bodyZh: '系统故障', bodyEn: 'System failure',
  typeCode: 'ALERT', typeLabelZh: '警告', typeLabelEn: 'Alert',
  typeColor: 'red', typeIcon: 'bell',
  pinned: true, startsAt: null, endsAt: null, active: true, createdAt: '2026-01-02T00:00:00Z',
}

beforeEach(() => {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
})

describe('AnnouncementsPanel', () => {
  it('renders nothing when infoPanelEnabled is false', async () => {
    server.use(http.get(`${BASE}/api/portal/announcements`, () => HttpResponse.json([ANN_1, ANN_2])))
    const pinia = createPinia()
    setActivePinia(pinia)
    const config = useConfigStore()
    config.config.infoPanelEnabled = false

    const w = mount(AnnouncementsPanel, { global: { plugins: [pinia, i18n] } })
    await flushPromises()
    expect(w.text()).toBe('')
  })

  it('enabled + 0 announcements → renders placeholder', async () => {
    server.use(http.get(`${BASE}/api/portal/announcements`, () => HttpResponse.json([])))
    const pinia = createPinia()
    setActivePinia(pinia)
    const config = useConfigStore()
    config.config.infoPanelEnabled = true

    const w = mount(AnnouncementsPanel, { global: { plugins: [pinia, i18n] } })
    await flushPromises()

    expect(w.text()).toContain('暂无公告')
  })

  it('enabled + 2 announcements → renders 2 items, no × buttons', async () => {
    server.use(http.get(`${BASE}/api/portal/announcements`, () => HttpResponse.json([ANN_1, ANN_2])))
    const pinia = createPinia()
    setActivePinia(pinia)
    const config = useConfigStore()
    config.config.infoPanelEnabled = true

    const w = mount(AnnouncementsPanel, { global: { plugins: [pinia, i18n] } })
    await flushPromises()

    expect(w.text()).toContain('计划停机')
    expect(w.text()).toContain('紧急公告')
    expect(w.findAll('[data-testid^="dismiss-"]').length).toBe(0)
  })
})
