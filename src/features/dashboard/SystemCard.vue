<script setup lang="ts">
import { computed } from 'vue'
import type { HomeLink } from '@/lib/api/types'
import { useLocale } from '@/lib/i18n/useLocale'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import StatusDot from '@/lib/ui/StatusDot.vue'
import { LINK_STATUS, LINK_ENVS } from '@/constants'
const props = defineProps<{ link: HomeLink }>()
const emit = defineEmits<{ blocked: [{ link: HomeLink; url: string }] }>()
const { pick, t } = useLocale()
const name = computed(() => pick(props.link, 'name'))
const statusText = computed(() => props.link.statusCode === LINK_STATUS.ACTIVE ? t('dashboard.status.active') : props.link.statusCode === LINK_STATUS.MAINTENANCE ? t('dashboard.status.maintenance') : props.link.statusCode === LINK_STATUS.DEPRECATED ? t('dashboard.status.deprecated') : props.link.statusCode)
const envButtons = computed(() => LINK_ENVS.filter(e => (props.link as any)[e.field]))
// Non-active systems warn the user before opening (maintenance/deprecated).
function onClick(e: MouseEvent, url: string) { if (props.link.statusCode !== LINK_STATUS.ACTIVE) { e.preventDefault(); emit('blocked', { link: props.link, url }) } }
</script>
<template>
  <!-- env-aware: card is not itself a link; env buttons below provide navigation -->
  <GlassCard v-if="envButtons.length" class="flex flex-col gap-2 p-3.5 transition hover:-translate-y-0.5">
    <div class="flex items-center gap-3">
      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white"><AppIcon :name="link.icon" class="size-[18px]" /></span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ name }}</span>
        <span class="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-2"><StatusDot :status="link.statusCode" /> {{ statusText }}</span>
      </span>
    </div>
    <div class="flex flex-wrap gap-1.5">
      <a
        v-for="e in envButtons"
        :key="e.key"
        :href="(link as any)[e.field]"
        :target="link.openInNewTab ? '_blank' : '_self'"
        rel="noopener noreferrer"
        :class="['rounded-lg px-2.5 py-1 text-xs font-semibold transition', e.btn]"
        @click="onClick($event, (link as any)[e.field])"
      >{{ e.label }}</a>
    </div>
  </GlassCard>
  <!-- plain: whole card is a link -->
  <a v-else :href="link.url" :target="link.openInNewTab ? '_blank' : '_self'" rel="noopener noreferrer" class="block" @click="onClick($event, link.url ?? '')">
    <GlassCard class="flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5">
      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white"><AppIcon :name="link.icon" class="size-[18px]" /></span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ name }}</span>
        <span class="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-2"><StatusDot :status="link.statusCode" /> {{ statusText }}</span>
      </span>
    </GlassCard>
  </a>
</template>
