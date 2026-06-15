<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Pin } from 'lucide-vue-next'
import { DialogTitle } from 'reka-ui'
import Modal from '@/lib/ui/Modal.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import type { Announcement } from '@/lib/api/announcements'
import { useLocale } from '@/lib/i18n/useLocale'
import { colorClasses } from '@/lib/ui/announcementColor'

const props = defineProps<{ open: boolean; announcement: Announcement | null }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const { locale, pick, t } = useLocale()

// Lazy-load the full markdown renderer (markdown-it + DOMPurify) only when an
// announcement is shown — keeps it off the dashboard's critical-path bundle.
const html = ref('')
let renderSeq = 0
watch([() => props.announcement, locale], async ([a]) => {
  const seq = ++renderSeq
  if (!a) { html.value = ''; return }
  const { renderMarkdown } = await import('@/lib/ui/markdown')
  // Guard against out-of-order resolution if the announcement/locale changes
  // while a prior dynamic import / render is still in flight.
  if (seq === renderSeq) html.value = renderMarkdown(pick(a, 'body'))
}, { immediate: true })

function fmt(s?: string | null) {
  if (!s) return ''
  return new Date(s).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US')
}

const windowText = computed(() => {
  const a = props.announcement
  if (!a) return ''
  const s = fmt(a.startsAt), e = fmt(a.endsAt)
  if (s && e) return `${s} ${t('dashboard.announcements.to')} ${e}`
  return s || e
})
</script>

<template>
  <Modal
    size="2xl"
    :open="open"
    :title="''"
    @update:open="(v) => emit('update:open', v)"
  >
    <div v-if="announcement">
      <!-- header row -->
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-medium"
          :class="colorClasses(announcement.typeColor).chip"
        >
          <AppIcon :name="announcement.typeIcon" class="size-4" />
          {{ pick(announcement, 'typeLabel') }}
        </span>
        <span v-if="announcement.pinned" class="flex items-center gap-1 text-xs text-ink-3">
          <Pin class="size-3.5" />{{ t('dashboard.announcements.pinned') }}
        </span>
      </div>

      <!-- title -->
      <DialogTitle class="mt-3 text-xl font-bold leading-snug">{{ pick(announcement, 'title') }}</DialogTitle>

      <!-- meta -->
      <div class="mt-1 text-xs text-ink-3">
        {{ t('dashboard.announcements.publishedAt') }} {{ fmt(announcement.createdAt) }}<template v-if="announcement.startsAt || announcement.endsAt"> · {{ t('dashboard.announcements.window') }} {{ windowText }}</template>
      </div>

      <hr class="my-4 border-border" />

      <!-- body -->
      <div class="markdown-body markdown-body-lg" v-html="html"></div>
    </div>
  </Modal>
</template>
