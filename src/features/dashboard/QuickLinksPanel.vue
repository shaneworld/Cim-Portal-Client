<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ExternalLink } from 'lucide-vue-next'
import { listQuickLinks } from '@/lib/api/portal'
import type { QuickLink } from '@/lib/api/quickLinks'
import { useConfigStore } from '@/stores/config'
import { useLocale } from '@/lib/i18n/useLocale'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'

const cfg = useConfigStore()
const { pick, t } = useLocale()

const links = ref<QuickLink[]>([])

onMounted(async () => {
  if (!cfg.config.infoPanelEnabled) return
  try {
    links.value = await listQuickLinks()
  } catch {
    // silently ignore — panel simply won't show
  }
})
</script>

<template>
  <template v-if="cfg.config.infoPanelEnabled && links.length > 0">
    <GlassCard class="p-4">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-2">
        <ExternalLink class="size-4 shrink-0" />
        {{ t('dashboard.quickLinks.title') }}
      </h2>
      <div class="space-y-2">
        <a
          v-for="l in links"
          :key="l.id"
          :href="l.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/40 px-3 py-2 transition hover:bg-[hsl(var(--primary)/0.08)]"
        >
          <!-- icon chip -->
          <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AppIcon :name="l.icon || 'external-link'" class="size-4" />
          </span>
          <!-- label -->
          <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ pick(l, 'label') }}</span>
        </a>
      </div>
    </GlassCard>
  </template>
</template>
