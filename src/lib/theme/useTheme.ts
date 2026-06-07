import { ref } from 'vue'
import { STORAGE_KEYS } from '@/constants'

export type ThemeMode = 'light' | 'dark' | 'system'

const KEY = STORAGE_KEYS.theme
const mode = ref<ThemeMode>((localStorage.getItem(KEY) as ThemeMode | null) ?? 'system')

function systemDark() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply() {
  const dark = mode.value === 'dark' || (mode.value === 'system' && systemDark())
  document.documentElement.classList.toggle('dark', dark)
}

export function useTheme() {
  function setMode(m: ThemeMode) {
    mode.value = m
    localStorage.setItem(KEY, m)
    apply()
  }

  function init() {
    mode.value = (localStorage.getItem(KEY) as ThemeMode | null) ?? 'system'
    apply()
  }

  return { mode, setMode, init }
}
