import { useI18n } from 'vue-i18n'
import { i18n } from './index'

/** Pick the localized field, e.g. pick(link,'name') → nameZh|nameEn by locale. */
export function pick<T extends Record<string, any>>(obj: T, key: string): string {
  const loc = i18n.global.locale.value
  const suffix = loc === 'en' ? 'En' : 'Zh'
  return obj[`${key}${suffix}`] ?? ''
}

export function useLocale() {
  const { t, locale } = useI18n({ useScope: 'global' })
  return { locale, pick, t }
}
