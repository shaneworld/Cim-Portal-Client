import { isTauri } from '@tauri-apps/api/core'
import { i18n } from '@/lib/i18n'

/** Tauri 桌面端:启动时检查更新;web/test 环境为 no-op。 */
export async function maybeCheckForUpdates(): Promise<void> {
  if (!isTauri()) return
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()
    if (!update) return
    const { ask } = await import('@tauri-apps/plugin-dialog')
    const yes = await ask(i18n.global.t('updater.found', { version: update.version }), { title: i18n.global.t('updater.title'), kind: 'info' })
    if (!yes) return
    await update.downloadAndInstall()
    const { relaunch } = await import('@tauri-apps/plugin-process')
    await relaunch()
  } catch (e) {
    console.warn('[updater] 检查更新失败', e)
  }
}
