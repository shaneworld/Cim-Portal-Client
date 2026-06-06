import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { usePagination } from './usePagination'

describe('usePagination', () => {
  it('切片 + totalPages', () => {
    const items = ref(Array.from({ length: 20 }, (_, i) => i + 1))
    const { page, paged, total, totalPages } = usePagination(items, 10)
    expect(total.value).toBe(20); expect(totalPages.value).toBe(2)
    expect(paged.value).toEqual([1,2,3,4,5,6,7,8,9,10])
    page.value = 2
    expect(paged.value).toEqual([11,12,13,14,15,16,17,18,19,20])
  })
  it('列表缩短后当前页越界回夹', async () => {
    const items = ref(Array.from({ length: 20 }, (_, i) => i + 1))
    const { page, totalPages } = usePagination(items, 10)
    page.value = 2
    items.value = [1, 2, 3]
    await nextTick()
    expect(totalPages.value).toBe(1); expect(page.value).toBe(1)
  })
  it('reset 回第 1 页', () => {
    const items = ref(Array.from({ length: 30 }, (_, i) => i))
    const { page, reset } = usePagination(items, 10)
    page.value = 3; reset(); expect(page.value).toBe(1)
  })
  it('接受 ref pageSize:改 ref 重算并回夹', async () => {
    const items = ref(Array.from({ length: 30 }, (_, i) => i + 1))
    const size = ref(5)
    const { page, paged, totalPages } = usePagination(items, size)
    expect(paged.value.length).toBe(5); expect(totalPages.value).toBe(6)
    page.value = 6
    size.value = 20
    await nextTick()
    expect(totalPages.value).toBe(2); expect(page.value).toBe(2)
    expect(paged.value.length).toBe(10)
  })
})
