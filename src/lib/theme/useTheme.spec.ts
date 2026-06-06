import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  beforeEach(() => { localStorage.clear(); document.documentElement.classList.remove('dark') })
  it('defaults to a valid mode; setMode persists + toggles dark class', () => {
    const { mode, setMode } = useTheme()
    expect(['light', 'dark', 'system']).toContain(mode.value)
    setMode('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('cimp.theme')).toBe('dark')
    setMode('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
