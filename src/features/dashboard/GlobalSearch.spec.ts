import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GlobalSearch from './GlobalSearch.vue'

describe('GlobalSearch', () => {
  it('emits on input and shows result count + clears', async () => {
    const w = mount(GlobalSearch, { props: { query: 'wip', resultCount: 3 } })
    expect(w.text()).toContain('找到 3 个')
    await w.get('input').setValue('oee')
    expect(w.emitted('update:query')?.at(-1)).toEqual(['oee'])
    await w.get('[data-testid="search-clear"]').trigger('click')
    expect(w.emitted('update:query')?.at(-1)).toEqual([''])
  })
})
