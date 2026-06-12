import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import { useConfigStore } from '@/stores/config'
import DutyLinesPanel from './DutyLinesPanel.vue'

const BASE = 'http://localhost:8080'

const LINE_1 = {
  id: 1, labelZh: 'IT 支持', labelEn: 'IT Support', phone: '400-123-4567', sortOrder: 1, active: true,
}
const LINE_2 = {
  id: 2, labelZh: '网络运维', labelEn: 'Network Ops', phone: '400-987-6543', sortOrder: 2, active: true,
}

beforeEach(() => {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'zh'
  configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
})

describe('DutyLinesPanel', () => {
  it('renders nothing when infoPanelEnabled is false', async () => {
    server.use(http.get(`${BASE}/api/portal/duty-lines`, () => HttpResponse.json([LINE_1, LINE_2])))
    const pinia = createPinia()
    setActivePinia(pinia)
    const config = useConfigStore()
    config.config.infoPanelEnabled = false

    const w = mount(DutyLinesPanel, { global: { plugins: [pinia, i18n] } })
    await flushPromises()
    expect(w.text()).toBe('')
  })

  it('renders the card with an empty placeholder when enabled but list is empty', async () => {
    server.use(http.get(`${BASE}/api/portal/duty-lines`, () => HttpResponse.json([])))
    const pinia = createPinia()
    setActivePinia(pinia)
    const config = useConfigStore()
    config.config.infoPanelEnabled = true

    const w = mount(DutyLinesPanel, { global: { plugins: [pinia, i18n] } })
    await flushPromises()
    // card is now always rendered (fixed-height column); shows the empty-state placeholder
    expect(w.find('.glass').exists()).toBe(true)
    expect(w.text()).toContain(i18n.global.t('dashboard.dutyLines.empty'))
  })

  it('renders 2 duty lines with their phone numbers when enabled and populated', async () => {
    server.use(http.get(`${BASE}/api/portal/duty-lines`, () => HttpResponse.json([LINE_1, LINE_2])))
    const pinia = createPinia()
    setActivePinia(pinia)
    const config = useConfigStore()
    config.config.infoPanelEnabled = true

    const w = mount(DutyLinesPanel, { global: { plugins: [pinia, i18n] } })
    await flushPromises()

    expect(w.text()).toContain('IT 支持')
    expect(w.text()).toContain('网络运维')
    expect(w.find('[data-testid="duty-phone-1"]').text()).toBe('400-123-4567')
    expect(w.find('[data-testid="duty-phone-2"]').text()).toBe('400-987-6543')
  })

  it('shows the resolved on-duty person name when dutyName is present', async () => {
    server.use(http.get(`${BASE}/api/portal/duty-lines`, () => HttpResponse.json([
      { ...LINE_1, dutyName: '张三', scheduleName: 'IT-roster' },
      LINE_2,
    ])))
    const pinia = createPinia()
    setActivePinia(pinia)
    const config = useConfigStore()
    config.config.infoPanelEnabled = true

    const w = mount(DutyLinesPanel, { global: { plugins: [pinia, i18n] } })
    await flushPromises()

    expect(w.text()).toContain('张三')
    expect(w.find('[data-testid="duty-name-1"]').exists()).toBe(true)
    expect(w.find('[data-testid="duty-name-1"]').text()).toBe('张三')
    // line 2 has no dutyName → no person-name span rendered for it
    expect(w.text()).toContain('网络运维')
    expect(w.find('[data-testid="duty-name-2"]').exists()).toBe(false)
  })
})
