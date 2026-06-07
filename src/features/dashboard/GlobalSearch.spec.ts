import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/lib/i18n'
import GlobalSearch from './GlobalSearch.vue'

describe('GlobalSearch', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh' })
  it('emits on input and shows result count + clears', async () => {
    const w = mount(GlobalSearch, { props: { query: 'wip', resultCount: 3 }, global: { plugins: [i18n] } })
    expect(w.text()).toContain('找到 3 个')
    await w.get('input').setValue('oee')
    expect(w.emitted('update:query')?.at(-1)).toEqual(['oee'])
    await w.get('[data-testid="search-clear"]').trigger('click')
    expect(w.emitted('update:query')?.at(-1)).toEqual([''])
  })
})
