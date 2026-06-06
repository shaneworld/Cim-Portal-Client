<script setup lang="ts">
import { Phone } from 'lucide-vue-next'
</script>

<template>
  <footer class="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-1.5 px-4 pb-5 pt-3 text-xs text-ink-3">
    <Phone class="size-3.5 text-[hsl(var(--primary))]" />
    遇到问题请拨打 <b class="font-mono text-sm text-ink-2">39100</b>
    <span>· Call 39100 if you run into problems</span>
  </footer>
</template>
