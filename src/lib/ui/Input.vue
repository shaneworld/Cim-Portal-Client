<script setup lang="ts">
defineProps<{ modelValue?: string; placeholder?: string; type?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
</script>
<template>
  <input :type="type ?? 'text'" :value="modelValue" :placeholder="placeholder"
    class="h-10 w-full rounded-xl border border-input glass-strong px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
</template>
