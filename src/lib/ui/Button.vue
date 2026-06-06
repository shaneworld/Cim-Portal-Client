<script setup lang="ts">
defineProps<{ variant?: 'primary' | 'ghost' | 'outline'; type?: 'button' | 'submit' }>()
const emit = defineEmits<{ click: [MouseEvent] }>()
</script>
<template>
  <button :type="type ?? 'button'"
    class="inline-flex items-center justify-center gap-2 rounded-xl px-4 h-10 text-sm font-semibold transition active:scale-[.98] disabled:opacity-50"
    :class="{
      'bg-brand text-white shadow-lg shadow-indigo-500/25': (variant ?? 'primary') === 'primary',
      'glass-strong rounded-xl text-ink-2 hover:text-[hsl(var(--ink))]': variant === 'ghost',
      'border border-border bg-transparent text-ink-2': variant === 'outline',
    }"
    @click="emit('click', $event)"><slot /></button>
</template>
