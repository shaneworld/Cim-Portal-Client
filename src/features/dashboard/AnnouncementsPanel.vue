<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Pin } from 'lucide-vue-next'
import { listAnnouncements } from '@/lib/api/portal'
import type { Announcement } from '@/lib/api/announcements'
import { useConfigStore } from '@/stores/config'
import { useLocale } from '@/lib/i18n/useLocale'
import { colorClasses } from '@/lib/ui/announcementColor'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'

const cfg = useConfigStore()
const { pick, t } = useLocale()

const all = ref<Announcement[]>([])

onMounted(async () => {
  if (!cfg.config.infoPanelEnabled) return
  try {
    all.value = await listAnnouncements()
  } catch {
    // silently ignore — panel still shows with empty placeholder
  }
})
</script>

<template>
  <GlassCard v-if="cfg.config.infoPanelEnabled" class="p-4">
    <h2 class="mb-3 text-sm font-semibold text-ink-2">{{ t('dashboard.announcements.title') }}</h2>
    <div class="max-h-[22rem] overflow-y-auto pr-1">
      <div v-if="all.length === 0" class="py-4 text-center text-sm text-ink-3">
        {{ t('dashboard.announcements.empty') }}
      </div>
      <div v-else class="space-y-2">
      <div
        v-for="a in all"
        :key="a.id"
        class="flex items-start gap-3 rounded-xl border p-3"
        :class="colorClasses(a.typeColor).wrap"
      >
        <!-- icon chip -->
        <span
          class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
          :class="colorClasses(a.typeColor).chip"
        >
          <AppIcon :name="a.typeIcon" class="size-4" />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <!-- type tag -->
            <span
              class="rounded px-1.5 py-0.5 text-[11px] font-medium"
              :class="colorClasses(a.typeColor).tag"
            >{{ pick(a, 'typeLabel') }}</span>
            <!-- pinned marker -->
            <span v-if="a.pinned" class="flex items-center gap-0.5 text-[11px] text-ink-3">
              <Pin class="size-3" />{{ t('dashboard.announcements.pinned') }}
            </span>
          </div>
          <p class="mt-1 text-sm font-medium">{{ pick(a, 'title') }}</p>
          <p class="mt-0.5 whitespace-pre-line text-xs text-ink-2">{{ pick(a, 'body') }}</p>
        </div>
      </div>
      </div>
    </div>
  </GlassCard>
</template>
