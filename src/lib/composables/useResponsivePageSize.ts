import { onMounted, onBeforeUnmount, watch, type Ref } from 'vue'
import { PAGE_ROW_HEIGHT_PX, MIN_PAGE_ROWS } from '@/constants'

export function computeRows(height: number, rowHeight: number, min: number): number {
  return Math.max(min, Math.floor(height / rowHeight))
}

export function useResponsivePageSize(
  el: Ref<HTMLElement | undefined>,
  out: Ref<number>,
  rowHeight = PAGE_ROW_HEIGHT_PX,
  min = MIN_PAGE_ROWS,
) {
  let ro: ResizeObserver | undefined
  function measure() { if (el.value) out.value = computeRows(el.value.clientHeight, rowHeight, min) }
  onMounted(() => {
    if (typeof ResizeObserver === 'undefined') return
    ro = new ResizeObserver(measure)
    watch(el, (node) => { ro!.disconnect(); if (node) ro!.observe(node) }, { immediate: true })
  })
  onBeforeUnmount(() => ro?.disconnect())
}
