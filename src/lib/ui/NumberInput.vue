<script setup lang="ts">
import { ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useLocale } from '@/lib/i18n/useLocale'
defineOptions({ inheritAttrs: false })
const props = defineProps<{ modelValue: number; min?: number; step?: number }>()
const emit = defineEmits<{ 'update:modelValue': [number] }>()
const { t } = useLocale()
function set(v: number) { emit('update:modelValue', Math.max(props.min ?? 0, v)) }
function bump(dir: 1 | -1) { set((Number(props.modelValue) || 0) + dir * (props.step ?? 1)) }
function onInput(e: Event) { const n = Number((e.target as HTMLInputElement).value); emit('update:modelValue', Number.isNaN(n) ? 0 : n) }
</script>

<template>
  <div class="flex h-10 w-full items-stretch overflow-hidden rounded-xl border border-input glass-strong focus-within:ring-2 focus-within:ring-ring">
    <input
      type="number"
      :value="modelValue"
      v-bind="$attrs"
      class="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      @input="onInput"
    />
    <div class="flex w-8 shrink-0 flex-col border-l border-border/60">
      <button type="button" tabindex="-1" :aria-label="t('ui.numberInput.increase')"
        class="grid flex-1 place-items-center text-ink-3 transition hover:bg-[hsl(var(--primary)/0.12)] hover:text-[hsl(var(--primary))]"
        @click="bump(1)"><ChevronUp class="size-3.5" /></button>
      <button type="button" tabindex="-1" :aria-label="t('ui.numberInput.decrease')"
        class="grid flex-1 place-items-center border-t border-border/60 text-ink-3 transition hover:bg-[hsl(var(--primary)/0.12)] hover:text-[hsl(var(--primary))]"
        @click="bump(-1)"><ChevronDown class="size-3.5" /></button>
    </div>
  </div>
</template>
