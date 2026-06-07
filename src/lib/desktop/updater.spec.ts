import { describe, it, expect, vi } from 'vitest'

vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => false }))

describe('maybeCheckForUpdates', () => {
  it('非 Tauri 环境直接返回,不抛错', async () => {
    const { maybeCheckForUpdates } = await import('./updater')
    await expect(maybeCheckForUpdates()).resolves.toBeUndefined()
  })
})
