import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import AccessRequestModal from './AccessRequestModal.vue'
import { useToastStore } from '@/stores/toast'

// Mock the portal API module — requestAccess is what we assert on.
vi.mock('@/lib/api/portal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/portal')>()
  return { ...actual, requestAccess: vi.fn().mockResolvedValue(undefined) }
})

const link = {
  id: 7,
  nameZh: '在制品管理',
  nameEn: 'WIP',
  url: 'https://x',
  icon: 'factory',
  statusCode: 'ACTIVE',
  openInNewTab: true,
  launchApp: false,
  accessible: false,
  favorite: false,
}

describe('AccessRequestModal', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh'; setActivePinia(createPinia()) })
  afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

  it('fills reason and submits → calls requestAccess(id, reason), success toast, closes', async () => {
    const portalMod = await import('@/lib/api/portal')
    const spy = vi.spyOn(portalMod, 'requestAccess').mockResolvedValue(undefined)
    const toast = useToastStore()
    const pushSpy = vi.spyOn(toast, 'push')

    const w = mount(AccessRequestModal, { props: { open: true, link }, global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    const ta = document.body.querySelector('[data-testid="ar-reason"]') as HTMLTextAreaElement
    ta.value = '需要查看产线数据'
    ta.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const submit = document.body.querySelector('[data-testid="ar-submit"]') as HTMLButtonElement
    submit.click()
    await flushPromises()

    expect(spy).toHaveBeenCalledWith(7, '需要查看产线数据')
    expect(pushSpy).toHaveBeenCalledWith({ type: 'success', message: i18n.global.t('dashboard.accessRequest.sent') })
    expect(w.emitted('update:open')?.some((e) => e[0] === false)).toBe(true)
    w.unmount()
  })

  it('submit without reason → requestAccess(id, undefined)', async () => {
    const portalMod = await import('@/lib/api/portal')
    const spy = vi.spyOn(portalMod, 'requestAccess').mockResolvedValue(undefined)

    const w = mount(AccessRequestModal, { props: { open: true, link }, global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    const submit = document.body.querySelector('[data-testid="ar-submit"]') as HTMLButtonElement
    submit.click()
    await flushPromises()

    expect(spy).toHaveBeenCalledWith(7, undefined)
    w.unmount()
  })

  it('on rejection → error toast, stays open', async () => {
    const portalMod = await import('@/lib/api/portal')
    vi.spyOn(portalMod, 'requestAccess').mockRejectedValue(new Error('boom'))
    const toast = useToastStore()
    const pushSpy = vi.spyOn(toast, 'push')

    const w = mount(AccessRequestModal, { props: { open: true, link }, global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    const submit = document.body.querySelector('[data-testid="ar-submit"]') as HTMLButtonElement
    submit.click()
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith({ type: 'error', message: i18n.global.t('dashboard.accessRequest.failed') })
    expect(w.emitted('update:open')?.some((e) => e[0] === false)).toBeFalsy()
    w.unmount()
  })

  it('null link → submit is a no-op', async () => {
    const portalMod = await import('@/lib/api/portal')
    const spy = vi.spyOn(portalMod, 'requestAccess').mockResolvedValue(undefined)

    const w = mount(AccessRequestModal, { props: { open: true, link: null }, global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()
    const submit = document.body.querySelector('[data-testid="ar-submit"]') as HTMLButtonElement
    submit.click()
    await flushPromises()

    expect(spy).not.toHaveBeenCalled()
    w.unmount()
  })
})
