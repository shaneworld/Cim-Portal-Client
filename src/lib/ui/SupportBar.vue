<script setup lang="ts">
import { Phone } from 'lucide-vue-next'
import { SUPPORT_PHONE } from '@/constants'
import { useLocale } from '@/lib/i18n/useLocale'

const { t } = useLocale()
</script>

<template>
  <footer class="mt-2 flex flex-wrap items-center justify-center gap-1.5 border-t border-border/60 px-4 py-6 text-xs text-ink-3">
    <Phone class="size-3.5 text-[hsl(var(--primary))]" />
    {{ t('dashboard.support.line') }} <b class="font-mono text-sm text-ink-2">{{ SUPPORT_PHONE }}</b>
    <span>· {{ t('dashboard.support.call', { phone: SUPPORT_PHONE }) }}</span>
  </footer>
</template>
