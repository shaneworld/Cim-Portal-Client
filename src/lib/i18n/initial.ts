import { pinyin } from 'pinyin-pro'

type Locale = 'zh' | 'en'

/** 名称首字母:zh 取首字符拼音首字母(拉丁透传),en 取首字符;非 A–Z → '#'。 */
export function initialFor(name: string, locale: Locale): string {
  const s = (name ?? '').trim()
  if (!s) return '#'
  let ch: string
  if (locale === 'zh') {
    const first = pinyin(s[0], { pattern: 'first', toneType: 'none', type: 'array' })[0]
    ch = (first ?? s[0]).charAt(0)
  } else {
    ch = s.charAt(0)
  }
  const up = ch.toUpperCase()
  return /^[A-Z]$/.test(up) ? up : '#'
}

/** 一组名称出现过的首字母集合。 */
export function availableInitials(names: string[], locale: Locale): Set<string> {
  return new Set(names.map((n) => initialFor(n, locale)))
}
