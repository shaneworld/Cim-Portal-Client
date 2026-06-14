<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Phone } from 'lucide-vue-next'
import { SUPPORT_PHONE } from '@/constants'
import { useLocale } from '@/lib/i18n/useLocale'
import { useConfigStore } from '@/stores/config'
import FeedbackModal from '@/features/feedback/FeedbackModal.vue'

const { t } = useLocale()
const { config } = storeToRefs(useConfigStore())
const fbOpen = ref(false)
</script>

<template>
  <footer class="mt-2 flex flex-wrap items-center justify-center gap-1.5 border-t border-border/60 px-4 py-6 text-xs text-ink-3">
    <Phone class="size-3.5 text-[hsl(var(--primary))]" />
    {{ t('dashboard.support.line') }} <b class="font-mono text-sm text-ink-2">{{ SUPPORT_PHONE }}</b>
    <span>· {{ t('dashboard.support.call', { phone: SUPPORT_PHONE }) }}</span>
    <button
      v-if="config.larkEnabled"
      data-testid="fb-link"
      class="text-ink-3 underline-offset-2 transition hover:text-ink-2 hover:underline"
      @click="fbOpen = true"
    >· {{ t('feedback.link') }}</button>
    <FeedbackModal v-model:open="fbOpen" />
  </footer>
</template>
