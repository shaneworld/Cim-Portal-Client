<script setup lang="ts">
import { computed } from 'vue'
import { iconFor } from './iconMap'

const props = defineProps<{ name: string }>()

const uploadId = computed(() => props.name?.startsWith('upload:') ? props.name.slice('upload:'.length) : null)
const Cmp = computed(() => iconFor(props.name))
</script>

<template>
  <img v-if="uploadId" :src="`/api/icons/${uploadId}`" class="object-contain" alt="" />
  <component v-else :is="Cmp" :stroke-width="2" />
</template>
