import { onMounted, onBeforeUnmount, watch, type Ref } from 'vue'

export function computeRows(height: number, rowHeight: number, min: number): number {
  return Math.max(min, Math.floor(height / rowHeight))
}

export function useResponsivePageSize(
  el: Ref<HTMLElement | undefined>,
  out: Ref<number>,
  rowHeight = 64,
  min = 5,
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
