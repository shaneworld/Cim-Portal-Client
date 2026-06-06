<script setup lang="ts">
import { computed } from 'vue'
import { iconFor } from './iconMap'

const props = defineProps<{ name: string }>()

const Cmp = computed(() => iconFor(props.name))
</script>

<template>
  <component :is="Cmp" :stroke-width="2" />
</template>
