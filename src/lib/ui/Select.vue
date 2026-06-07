<script setup lang="ts">
import { computed } from 'vue'
import { SelectRoot, SelectTrigger, SelectValue, SelectPortal, SelectContent, SelectViewport, SelectItem, SelectItemText, SelectItemIndicator } from 'reka-ui'
import { ChevronDown, Check } from 'lucide-vue-next'
import { useLocale } from '@/lib/i18n/useLocale'
const props = defineProps<{ modelValue: string; options: { value: string; label: string }[]; placeholder?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const { t } = useLocale()
const current = computed(() => props.options.find((o) => o.value === props.modelValue)?.label)
</script>
<template>
  <SelectRoot :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', (v ?? '') as string)">
    <SelectTrigger class="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input glass-strong px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <SelectValue :placeholder="placeholder ?? t('ui.select.placeholder')">{{ current ?? placeholder ?? t('ui.select.placeholder') }}</SelectValue>
      <ChevronDown class="size-4 shrink-0 text-ink-3" />
    </SelectTrigger>
    <SelectPortal>
      <SelectContent class="anim-fade z-[60] overflow-hidden rounded-xl border border-border bg-white p-1 shadow-xl dark:bg-[#141b2e]" position="popper" :side-offset="6">
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
