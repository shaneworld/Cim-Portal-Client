<script setup lang="ts">
import { X } from 'lucide-vue-next'
defineProps<{ available: Set<string>; active: string | null }>()
const emit = defineEmits<{ select: [string] }>()
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#']
function pick(letter: string) { emit('select', letter) }
</script>

<template>
  <nav class="glass fixed right-2 top-24 z-20 hidden flex-col items-center gap-0.5 rounded-full px-1 py-2 shadow-lg shadow-indigo-500/10 md:flex">
    <button
      v-if="active"
      type="button"
      data-testid="rail-clear"
      class="mb-1 grid size-5 place-items-center rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.2)]"
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
      class="grid size-5 place-items-center rounded-md text-[11px] leading-none transition"
      :class="active === l
        ? 'bg-brand font-bold text-white shadow'
        : available.has(l)
          ? 'font-bold text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.15)]'
          : 'cursor-default font-medium text-ink-3/30'"
      @click="available.has(l) && pick(l)"
    >
      {{ l }}
    </button>
  </nav>
</template>
