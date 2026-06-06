import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LetterRail from './LetterRail.vue'

describe('LetterRail', () => {
  const available = new Set(['S', 'Z', 'B'])
  it('渲染 A–Z 全部字母', () => {
    const w = mount(LetterRail, { props: { available, active: null } })
    const btns = w.findAll('button[data-letter]')
    const letters = btns.map((b) => b.attributes('data-letter'))
    expect(letters).toContain('A'); expect(letters).toContain('Z')
    expect(btns.length).toBeGreaterThanOrEqual(26)
  })
  it('不可用字母禁用,可用字母可点并 emit select', async () => {
    const w = mount(LetterRail, { props: { available, active: null } })
    const A = w.get('button[data-letter="A"]')
    expect(A.attributes('disabled')).toBeDefined()
    const S = w.get('button[data-letter="S"]')
    expect(S.attributes('disabled')).toBeUndefined()
    await S.trigger('click')
    expect(w.emitted('select')?.at(-1)).toEqual(['S'])
  })
  it('active 字母带高亮类;清除键 emit 空串', async () => {
    const w = mount(LetterRail, { props: { available, active: 'S' } })
    expect(w.get('button[data-letter="S"]').classes().join(' ')).toMatch(/bg-brand|text-white/)
    await w.get('[data-testid="rail-clear"]').trigger('click')
    expect(w.emitted('select')?.at(-1)).toEqual([''])
  })
})
