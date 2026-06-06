import { defineStore } from 'pinia'
import { i18n } from '@/lib/i18n'
import type { Locale } from '@/lib/api/types'

export const useLocaleStore = defineStore('locale', () => {
  function setLocale(l: Locale) { i18n.global.locale.value = l; localStorage.setItem('cimp.locale', l) }
  function initLocale() { const l = localStorage.getItem('cimp.locale') as Locale | null; if (l) i18n.global.locale.value = l }
  return { setLocale, initLocale }
})
