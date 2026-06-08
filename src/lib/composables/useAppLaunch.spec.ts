import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import { launchOrDownload } from './useAppLaunch'

beforeEach(() => {
  setActivePinia(createPinia())
  i18n.global.locale.value = 'zh'
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('launchOrDownload', () => {
  it('(a) 2s 后无接管 → window.open 以 downloadUrl 打开新标签', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    launchOrDownload('mesclient://launch', 'https://download.example.com')
    expect(openSpy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2000)
    expect(openSpy).toHaveBeenCalledWith('https://download.example.com', '_blank', 'noopener')
  })

  it('(b) blur 事件先触发 → 2s 到期后 window.open 不调用', async () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window)
    launchOrDownload('mesclient://launch', 'https://download.example.com')
    window.dispatchEvent(new Event('blur'))
    vi.advanceTimersByTime(2000)
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('(c) window.open 返回 null → toast store 收到 info push 含 action', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)
    launchOrDownload('mesclient://launch', 'https://download.example.com')
    vi.advanceTimersByTime(2000)
    const { useToastStore } = await import('@/stores/toast')
    const toastStore = useToastStore()
    expect(toastStore.toasts.length).toBe(1)
    expect(toastStore.toasts[0].type).toBe('info')
    expect(toastStore.toasts[0].action).toBeDefined()
    expect(toastStore.toasts[0].action?.href).toBe('https://download.example.com')
  })
})
