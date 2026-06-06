import { describe, it, expect } from 'vitest'
import { initialFor, availableInitials } from './initial'

describe('initialFor', () => {
  it('zh: 取中文名拼音首字母(大写)', () => {
    expect(initialFor('在制品管理', 'zh')).toBe('Z')
    expect(initialFor('设备综合效率', 'zh')).toBe('S')
    expect(initialFor('帮助文档', 'zh')).toBe('B')
  })
  it('zh: 拉丁/英文开头直接透传首字母', () => {
    expect(initialFor('SPC 分析', 'zh')).toBe('S')
  })
  it('en: 取英文名首字母(大写)', () => {
    expect(initialFor('WIP', 'en')).toBe('W')
    expect(initialFor('oee monitor', 'en')).toBe('O')
  })
  it('非字母首字符 → #;空串 → #', () => {
    expect(initialFor('123 报表', 'zh')).toBe('#')
    expect(initialFor('', 'en')).toBe('#')
  })
})

describe('availableInitials', () => {
  it('对名称集合求去重首字母集合', () => {
    const set = availableInitials(['在制品', 'SPC', '设备', '帮助'], 'zh')
    expect(set.has('Z')).toBe(true)
    expect(set.has('S')).toBe(true)
    expect(set.has('B')).toBe(true)
    expect(set.size).toBe(3)
  })
})
