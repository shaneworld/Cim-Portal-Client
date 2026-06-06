import { describe, it, expect } from 'vitest'
import { i18n } from './index'
import { pick } from './useLocale'

describe('useLocale.pick', () => {
  it('picks zh/en by current locale', () => {
    i18n.global.locale.value = 'zh'
    expect(pick({ nameZh: '在制品', nameEn: 'WIP' }, 'name')).toBe('在制品')
    i18n.global.locale.value = 'en'
    expect(pick({ nameZh: '在制品', nameEn: 'WIP' }, 'name')).toBe('WIP')
  })
})
