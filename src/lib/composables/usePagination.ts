import { ref, computed, watch, type Ref } from 'vue'

export function usePagination<T>(items: Ref<T[]>, pageSize = 10) {
  const page = ref(1)
  const total = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
  const paged = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize))
  watch(items, () => { if (page.value > totalPages.value) page.value = totalPages.value })
  function reset() { page.value = 1 }
  return { page, paged, total, totalPages, pageSize, reset }
}
