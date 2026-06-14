import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import FeedbackModal from './FeedbackModal.vue'
import { useToastStore } from '@/stores/toast'

// Mock the portal API module — sendFeedback is what we assert on.
vi.mock('@/lib/api/portal', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/portal')>()
  return { ...actual, sendFeedback: vi.fn().mockResolvedValue(undefined) }
})

describe('FeedbackModal', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh'; setActivePinia(createPinia()) })
  afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

  it('submit empty → shows required, sendFeedback NOT called', async () => {
    const portalMod = await import('@/lib/api/portal')
    const spy = vi.spyOn(portalMod, 'sendFeedback').mockResolvedValue(undefined)

    const w = mount(FeedbackModal, { props: { open: true }, global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    const submit = document.body.querySelector('[data-testid="fb-submit"]') as HTMLButtonElement
    submit.click()
    await flushPromises()

    expect(spy).not.toHaveBeenCalled()
    expect(document.body.querySelector('[data-testid="fb-required"]')).not.toBeNull()
    w.unmount()
  })

  it('submit with message → sendFeedback(trimmed), success toast, closes', async () => {
    const portalMod = await import('@/lib/api/portal')
    const spy = vi.spyOn(portalMod, 'sendFeedback').mockResolvedValue(undefined)
    const toast = useToastStore()
    const pushSpy = vi.spyOn(toast, 'push')

    const w = mount(FeedbackModal, { props: { open: true }, global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    const ta = document.body.querySelector('[data-testid="fb-message"]') as HTMLTextAreaElement
    ta.value = '  系统加载很慢  '
    ta.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const submit = document.body.querySelector('[data-testid="fb-submit"]') as HTMLButtonElement
    submit.click()
    await flushPromises()

    expect(spy).toHaveBeenCalledWith('系统加载很慢')
    expect(pushSpy).toHaveBeenCalledWith({ type: 'success', message: i18n.global.t('feedback.sent') })
    expect(w.emitted('update:open')?.some((e) => e[0] === false)).toBe(true)
    w.unmount()
  })

  it('on rejection → error toast, stays open', async () => {
    const portalMod = await import('@/lib/api/portal')
    vi.spyOn(portalMod, 'sendFeedback').mockRejectedValue(new Error('boom'))
    const toast = useToastStore()
    const pushSpy = vi.spyOn(toast, 'push')

    const w = mount(FeedbackModal, { props: { open: true }, global: { plugins: [i18n] }, attachTo: document.body })
    await flushPromises()

    const ta = document.body.querySelector('[data-testid="fb-message"]') as HTMLTextAreaElement
    ta.value = '反馈内容'
    ta.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()

    const submit = document.body.querySelector('[data-testid="fb-submit"]') as HTMLButtonElement
    submit.click()
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith({ type: 'error', message: i18n.global.t('feedback.failed') })
    expect(w.emitted('update:open')?.some((e) => e[0] === false)).toBeFalsy()
    w.unmount()
  })
})
