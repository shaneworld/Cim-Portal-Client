<script setup lang="ts">
import { computed } from 'vue'
import { SelectRoot, SelectTrigger, SelectValue, SelectPortal, SelectContent, SelectViewport, SelectItem, SelectItemText, SelectItemIndicator } from 'reka-ui'
import { ChevronDown, Check } from 'lucide-vue-next'
const props = defineProps<{ modelValue: string; options: { value: string; label: string }[]; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const current = computed(() => props.options.find((o) => o.value === props.modelValue)?.label)
</script>
<template>
  <SelectRoot :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', (v ?? '') as string)">
    <SelectTrigger class="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input glass-strong px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <SelectValue :placeholder="placeholder ?? '请选择'">{{ current ?? placeholder ?? '请选择' }}</SelectValue>
      <ChevronDown class="size-4 shrink-0 text-ink-3" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="anim-fade glass-strong z-[60] overflow-hidden rounded-xl border border-border p-1 shadow-xl" position="popper" :side-offset="6">
        <SelectViewport>
          <SelectItem v-for="o in options" :key="o.value" :value="o.value"
            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm outline-none data-[highlighted]:bg-[hsl(var(--primary)/0.12)]">
            <SelectItemText>{{ o.label }}</SelectItemText>
            <SelectItemIndicator><Check class="size-3.5 text-[hsl(var(--primary))]" /></SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
