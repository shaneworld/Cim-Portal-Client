import { defineStore } from 'pinia'
import { i18n } from '@/lib/i18n'
import type { Locale } from '@/lib/api/types'
import { STORAGE_KEYS } from '@/constants'

export const useLocaleStore = defineStore('locale', () => {
  function setLocale(l: Locale) { i18n.global.locale.value = l; localStorage.setItem(STORAGE_KEYS.locale, l) }
  function initLocale() { const l = localStorage.getItem(STORAGE_KEYS.locale) as Locale | null; if (l) i18n.global.locale.value = l }
  return { setLocale, initLocale }
})
