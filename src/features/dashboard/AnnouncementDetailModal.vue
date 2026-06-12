<script setup lang="ts">
import { Pin } from 'lucide-vue-next'
import Modal from '@/lib/ui/Modal.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import type { Announcement } from '@/lib/api/announcements'
import { useLocale } from '@/lib/i18n/useLocale'
import { colorClasses } from '@/lib/ui/announcementColor'
import { renderMarkdown } from '@/lib/ui/markdown'

const props = defineProps<{ open: boolean; announcement: Announcement | null }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()

const { pick, t } = useLocale()
</script>

<template>
  <Modal
    size="lg"
    :open="open"
    :title="announcement ? pick(announcement, 'title') : ''"
    @update:open="(v) => emit('update:open', v)"
  >
    <div v-if="announcement">
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <!-- icon chip -->
        <span
          class="flex size-7 shrink-0 items-center justify-center rounded-lg"
          :class="colorClasses(announcement.typeColor).chip"
        >
          <AppIcon :name="announcement.typeIcon" class="size-4" />
        </span>
        <!-- type tag -->
        <span
          class="rounded px-1.5 py-0.5 text-[11px] font-medium"
          :class="colorClasses(announcement.typeColor).tag"
        >{{ pick(announcement, 'typeLabel') }}</span>
        <!-- pinned marker -->
        <span v-if="announcement.pinned" class="flex items-center gap-0.5 text-[11px] text-ink-3">
          <Pin class="size-3" />{{ t('dashboard.announcements.pinned') }}
        </span>
      </div>
      <div class="markdown-body" v-html="renderMarkdown(pick(announcement, 'body'))"></div>
    </div>
  </Modal>
</template>
