<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Phone } from 'lucide-vue-next'
import { listDutyLines } from '@/lib/api/portal'
import type { DutyLine } from '@/lib/api/dutyLines'
import { useConfigStore } from '@/stores/config'
import { useLocale } from '@/lib/i18n/useLocale'
import GlassCard from '@/lib/ui/GlassCard.vue'

const cfg = useConfigStore()
const { pick, t } = useLocale()

const lines = ref<DutyLine[]>([])

onMounted(async () => {
  if (!cfg.config.infoPanelEnabled) return
  try {
    lines.value = await listDutyLines()
  } catch {
    // silently ignore — panel simply won't show
  }
})
</script>

<template>
  <GlassCard v-if="cfg.config.infoPanelEnabled" class="flex flex-col h-full p-4">
    <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-2">
      <Phone class="size-4 shrink-0" />
      {{ t('dashboard.dutyLines.title') }}
    </h2>
    <div class="flex-1 min-h-0 overflow-y-auto scroll-slim max-h-[60vh] md:max-h-none">
      <div v-if="lines.length === 0" class="py-4 text-center text-sm text-ink-3">
        {{ t('dashboard.dutyLines.empty') }}
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="line in lines"
          :key="line.id"
          class="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/40 px-3 py-2"
        >
          <!-- phone icon chip -->
          <span class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Phone class="size-4" />
          </span>
          <!-- label -->
          <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ pick(line, 'label') }}</span>
          <!-- on-duty person's name (when resolved from the external duty system) -->
          <span v-if="line.dutyName" class="shrink-0 truncate text-xs text-ink-2 max-w-[6rem]" :data-testid="`duty-name-${line.id}`">{{ line.dutyName }}</span>
          <!-- phone number -->
          <span class="shrink-0 tabular-nums font-semibold text-sm text-ink-1" :data-testid="`duty-phone-${line.id}`">{{ line.phone }}</span>
        </div>
      </div>
    </div>
  </GlassCard>
</template>
