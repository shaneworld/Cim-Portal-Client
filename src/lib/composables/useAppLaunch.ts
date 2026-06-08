import { useToastStore } from '@/stores/toast'
import { i18n } from '@/lib/i18n'

/** 经自定义 scheme 唤起本地应用;~2s 内无接管则新标签打开下载页(被拦截则 info toast 提示下载链接)。 */
export function launchOrDownload(scheme: string, downloadUrl: string, timeoutMs = 2000) {
  let settled = false
  const cleanup = () => {
    document.removeEventListener('visibilitychange', onVis)
    window.removeEventListener('blur', onBlur)
    window.removeEventListener('pagehide', onBlur)
  }
  const settle = () => { if (settled) return; settled = true; clearTimeout(timer); cleanup() }
  const onVis = () => { if (document.hidden) settle() }
  const onBlur = () => settle()
  const timer = window.setTimeout(() => {
    if (settled) return
    settled = true; cleanup()
    const win = window.open(downloadUrl, '_blank', 'noopener')
    if (!win) useToastStore().push({
      type: 'info',
      message: i18n.global.t('dashboard.launch.downloadHint'),
      action: { label: i18n.global.t('common.download'), href: downloadUrl },
    })
  }, timeoutMs)
  document.addEventListener('visibilitychange', onVis)
  window.addEventListener('blur', onBlur)
  window.addEventListener('pagehide', onBlur)
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = scheme
  document.body.appendChild(iframe)
  window.setTimeout(() => { iframe.remove() }, 1000)
}
