<script setup lang="ts">
import { X } from 'lucide-vue-next'
defineProps<{ available: Set<string>; active: string | null }>()
const emit = defineEmits<{ select: [string] }>()
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#']
function pick(letter: string) { emit('select', letter) }
</script>

<template>
  <nav class="fixed right-1 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-0.5 md:flex">
    <button
      v-if="active"
      type="button"
      data-testid="rail-clear"
      class="mb-1 grid size-5 place-items-center rounded-full text-ink-3 hover:text-[hsl(var(--ink))]"
      @click="emit('select', '')"
    >
      <X class="size-3.5" />
    </button>
    <button
      v-for="l in LETTERS"
      :key="l"
      type="button"
      :data-letter="l"
      :disabled="!available.has(l)"
      class="grid size-5 place-items-center rounded-md text-[11px] font-semibold leading-none transition"
      :class="active === l
        ? 'bg-brand text-white shadow'
        : available.has(l)
          ? 'text-ink-2 hover:bg-[hsl(var(--primary)/0.12)] hover:text-[hsl(var(--primary))]'
          : 'cursor-default text-ink-3/40'"
      @click="available.has(l) && pick(l)"
    >
      {{ l }}
    </button>
  </nav>
</template>
