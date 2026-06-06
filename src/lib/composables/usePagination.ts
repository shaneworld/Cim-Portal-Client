import { ref, computed, watch, toValue, type Ref, type MaybeRefOrGetter } from 'vue'

export function usePagination<T>(items: Ref<T[]>, pageSize: MaybeRefOrGetter<number>) {
  const page = ref(1)
  const size = computed(() => Math.max(1, toValue(pageSize)))
  const total = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
  const paged = computed(() => items.value.slice((page.value - 1) * size.value, page.value * size.value))
  watch([items, size], () => { if (page.value > totalPages.value) page.value = totalPages.value })
  function reset() { page.value = 1 }
  return { page, paged, total, totalPages, pageSize: size, reset }
}
