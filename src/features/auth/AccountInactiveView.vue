<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'
import { useLocale } from '@/lib/i18n/useLocale'

const { t } = useLocale()
</script>
<template>
  <div class="flex min-h-screen items-center justify-center p-4 sm:p-6">
    <GlassCard class="w-full max-w-md p-8 text-center animate-fade-up sm:p-10">
      <ShieldAlert class="mx-auto size-12 text-amber-500" />
      <h1 class="mt-3 text-xl font-semibold">{{ t('auth.inactive.title') }}</h1>
      <p class="mt-2 text-ink-2">{{ t('auth.inactive.message') }}</p>
    </GlassCard>
  </div>
</template>
