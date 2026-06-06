<script setup lang="ts">
import { computed } from 'vue'
import type { HomeLink } from '@/lib/api/types'
import { useLocale } from '@/lib/i18n/useLocale'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import StatusDot from '@/lib/ui/StatusDot.vue'
const props = defineProps<{ link: HomeLink }>()
const { pick } = useLocale()
const name = computed(() => pick(props.link, 'name'))
const statusText = computed(() => props.link.statusCode === 'ACTIVE' ? '运行中' : props.link.statusCode === 'MAINTENANCE' ? '维护中' : props.link.statusCode === 'DEPRECATED' ? '已停用' : props.link.statusCode)
</script>
<template>
  <a :href="link.url" :target="link.openInNewTab ? '_blank' : '_self'" rel="noopener noreferrer" class="block">
    <GlassCard class="flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5">
      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white"><AppIcon :name="link.icon" class="size-[18px]" /></span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ name }}</span>
        <span class="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-2"><StatusDot :status="link.statusCode" /> {{ statusText }} · {{ link.code }}</span>
      </span>
    </GlassCard>
  </a>
</template>
