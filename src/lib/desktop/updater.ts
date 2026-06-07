import { isTauri } from '@tauri-apps/api/core'

/** Tauri 桌面端:启动时检查更新;web/test 环境为 no-op。 */
export async function maybeCheckForUpdates(): Promise<void> {
  if (!isTauri()) return
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    const update = await check()
    if (!update) return
    const { ask } = await import('@tauri-apps/plugin-dialog')
    const yes = await ask(`发现新版本 ${update.version},是否现在更新?`, { title: '更新可用', kind: 'info' })
    if (!yes) return
    await update.downloadAndInstall()
    const { relaunch } = await import('@tauri-apps/plugin-process')
    await relaunch()
  } catch (e) {
    console.warn('[updater] 检查更新失败', e)
  }
}
