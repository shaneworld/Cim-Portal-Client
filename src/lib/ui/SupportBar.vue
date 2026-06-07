<script setup lang="ts">
import { Phone } from 'lucide-vue-next'
import { SUPPORT_PHONE } from '@/constants'
</script>

<template>
  <footer class="mt-2 flex flex-wrap items-center justify-center gap-1.5 border-t border-border/60 px-4 py-6 text-xs text-ink-3">
    <Phone class="size-3.5 text-[hsl(var(--primary))]" />
    遇到问题请拨打 <b class="font-mono text-sm text-ink-2">{{ SUPPORT_PHONE }}</b>
    <span>· Call {{ SUPPORT_PHONE }} if you run into problems</span>
  </footer>
</template>
