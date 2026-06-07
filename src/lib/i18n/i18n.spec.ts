import { describe, it, expect } from 'vitest'
import zh from './locales/zh'
import en from './locales/en'
import { i18n } from './index'

function leafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? leafKeys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`])
}

describe('i18n catalogs', () => {
  it('zh 与 en 叶子键完全一致(无漏译)', () => {
    expect(leafKeys(zh as Record<string, unknown>).sort()).toEqual(leafKeys(en as Record<string, unknown>).sort())
  })
  it('按 locale 解析', () => {
    i18n.global.locale.value = 'en'
    expect(i18n.global.t('brand.title')).toBe('CIM Portal')
    i18n.global.locale.value = 'zh'
    expect(i18n.global.t('brand.title')).toBe('CIM 门户')
  })
})
