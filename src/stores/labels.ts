import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLabels } from '@/lib/api/i18n'
import { i18n } from '@/lib/i18n'
import type { LabelMap, Locale } from '@/lib/api/types'
export const useLabelsStore = defineStore('labels', () => {
  const loaded = ref(false)
  async function hydrate() {
    const map: LabelMap = await getLabels()
    const zh: Record<string, string> = {}, en: Record<string, string> = {}
    for (const [k, v] of Object.entries(map)) { zh[k] = v.zh; en[k] = v.en }
    i18n.global.setLocaleMessage('zh', zh); i18n.global.setLocaleMessage('en', en)
    loaded.value = true
  }
  function setLocale(l: Locale) { i18n.global.locale.value = l; localStorage.setItem('cimp.locale', l) }
  function initLocale() { const l = localStorage.getItem('cimp.locale') as Locale | null; if (l) i18n.global.locale.value = l }
  return { loaded, hydrate, setLocale, initLocale }
})
