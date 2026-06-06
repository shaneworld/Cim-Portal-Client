import { defineStore } from 'pinia'
import { ref } from 'vue'
export type ToastType = 'success' | 'error'
export interface Toast { id: number; type: ToastType; message: string }
export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let seq = 0
  function dismiss(id: number) { toasts.value = toasts.value.filter((t) => t.id !== id) }
  function push(t: { type: ToastType; message: string }) { const id = ++seq; toasts.value.push({ id, ...t }); setTimeout(() => dismiss(id), 3500); return id }
  return { toasts, push, dismiss }
})
