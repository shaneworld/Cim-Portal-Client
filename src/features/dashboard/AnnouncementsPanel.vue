<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Pin, X } from 'lucide-vue-next'
import { listAnnouncements } from '@/lib/api/portal'
import type { Announcement } from '@/lib/api/announcements'
import { useConfigStore } from '@/stores/config'
import { useLocale } from '@/lib/i18n/useLocale'
import { colorClasses } from '@/lib/ui/announcementColor'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'

const DISMISSED_KEY = 'cim.dismissedAnnouncements'

const { config } = useConfigStore()
const { pick, t } = useLocale()

const all = ref<Announcement[]>([])
const dismissed = ref<number[]>([])

const items = computed(() => all.value.filter((a) => !dismissed.value.includes(a.id)))

function readDismissed(): number[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return []
    return JSON.parse(raw) as number[]
  } catch {
    return []
  }
}

function writeDismissed(ids: number[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids))
}

function dismiss(id: number) {
  const next = [...dismissed.value, id]
  dismissed.value = next
  writeDismissed(next)
}

onMounted(async () => {
  if (!config.announcementsEnabled) return
  dismissed.value = readDismissed()
  try {
    all.value = await listAnnouncements()
  } catch {
    // silently ignore — panel simply won't show
  }
})
</script>

<template>
  <template v-if="config.announcementsEnabled && items.length > 0">
    <GlassCard class="p-4">
      <h2 class="mb-3 text-sm font-semibold text-ink-2">{{ t('dashboard.announcements.title') }}</h2>
      <div class="space-y-2">
        <div
          v-for="a in items"
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

          <!-- dismiss -->
          <button
            type="button"
            class="ml-1 shrink-0 rounded p-0.5 text-ink-3 hover:text-ink-1 transition"
            :aria-label="t('dashboard.announcements.dismiss')"
            :data-testid="`dismiss-${a.id}`"
            @click="dismiss(a.id)"
          >
            <X class="size-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  </template>
</template>
