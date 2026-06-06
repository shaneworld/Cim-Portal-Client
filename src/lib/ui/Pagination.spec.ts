import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Pagination from './Pagination.vue'

describe('Pagination', () => {
  it('单页(total<=pageSize)不渲染', () => {
    const w = mount(Pagination, { props: { page: 1, total: 8, pageSize: 10 } })
    expect(w.find('[data-testid="page-next"]').exists()).toBe(false)
  })
  it('多页:prev 在首页禁用,next emit 下一页', async () => {
    const w = mount(Pagination, { props: { page: 1, total: 25, pageSize: 10 } })
    expect(w.get('[data-testid="page-prev"]').attributes('disabled')).toBeDefined()
    await w.get('[data-testid="page-next"]').trigger('click')
    expect(w.emitted('update:page')?.at(-1)).toEqual([2])
  })
  it('点页码 emit 该页;末页 next 禁用', async () => {
    const w = mount(Pagination, { props: { page: 3, total: 25, pageSize: 10 } })
    expect(w.get('[data-testid="page-next"]').attributes('disabled')).toBeDefined()
    await w.get('[data-testid="page-n-1"]').trigger('click')
    expect(w.emitted('update:page')?.at(-1)).toEqual([1])
  })
})
