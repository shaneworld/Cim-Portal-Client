<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from 'reka-ui'
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()
</script>
<template>
  <SwitchRoot :model-value="modelValue" @update:model-value="(v) => emit('update:modelValue', !!v)"
    class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition data-[state=checked]:bg-brand data-[state=unchecked]:bg-[hsl(var(--muted))]">
    <SwitchThumb class="block size-5 translate-x-0.5 rounded-full bg-white shadow transition data-[state=checked]:translate-x-[22px]" />
  </SwitchRoot>
</template>
