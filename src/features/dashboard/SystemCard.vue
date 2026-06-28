<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { HomeLink } from '@/lib/api/types'
import { useLocale } from '@/lib/i18n/useLocale'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import StatusDot from '@/lib/ui/StatusDot.vue'
import { Lock, Star } from 'lucide-vue-next'
import { LINK_STATUS } from '@/constants'
import { envColorClasses } from '@/lib/ui/envColor'
import { launchOrDownload } from '@/lib/composables/useAppLaunch'
import { toggleFavorite } from '@/lib/api/portal'
import { useToastStore } from '@/stores/toast'
const props = defineProps<{ link: HomeLink }>()
const emit = defineEmits<{ blocked: [HomeLink]; 'favorite-changed': [{ id: number; favorite: boolean }] }>()
const { pick, t } = useLocale()
const toast = useToastStore()
const name = computed(() => pick(props.link, 'name'))
const locked = computed(() => !props.link.accessible)
const statusText = computed(() => props.link.statusCode === LINK_STATUS.ACTIVE ? t('dashboard.status.active') : props.link.statusCode === LINK_STATUS.MAINTENANCE ? t('dashboard.status.maintenance') : props.link.statusCode === LINK_STATUS.DEPRECATED ? t('dashboard.status.deprecated') : props.link.statusCode)
const href = computed(() => locked.value ? undefined : props.link.launchApp ? (props.link.downloadUrl || props.link.url) : props.link.url)

// Local mirror of favorite for optimistic UI
const localFavorite = ref(props.link.favorite)
// Keep the optimistic star in sync when the favorite state changes externally
// (e.g. the same link unfavorited from its other card instance).
watch(() => props.link.favorite, (v) => { localFavorite.value = v })

// Non-active systems warn the user before opening (maintenance/deprecated).
// Active launch links use the scheme to trigger the native app prompt.
// Locked (inaccessible) links are hard-blocked before any other logic.
function onClick(e: MouseEvent) {
  if (locked.value) { e.preventDefault(); toast.push({ type: 'info', message: t('dashboard.noAccessHint') }); return }
  if (props.link.statusCode !== LINK_STATUS.ACTIVE) { e.preventDefault(); emit('blocked', props.link); return }
  if (props.link.launchApp) { e.preventDefault(); launchOrDownload(props.link.url!, props.link.downloadUrl ?? props.link.url!) }
}

async function onStarClick(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  const prev = localFavorite.value
  localFavorite.value = !prev
  try {
    await toggleFavorite(props.link.id, localFavorite.value)
    emit('favorite-changed', { id: props.link.id, favorite: localFavorite.value })
  } catch {
    localFavorite.value = prev
    toast.push({ type: 'error', message: t(localFavorite.value ? 'dashboard.favoriteRemove' : 'dashboard.favoriteAdd') })
  }
}
</script>
<template>
  <a :href="href" :target="link.openInNewTab ? '_blank' : '_self'" rel="noopener noreferrer" :title="locked ? t('dashboard.noAccessHint') : undefined" :aria-disabled="locked" :class="['block relative', locked && 'opacity-60 cursor-not-allowed']" @click="onClick">
    <GlassCard class="flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5">
      <span :class="['grid size-9 shrink-0 place-items-center rounded-xl', link.icon?.startsWith('upload:') ? 'border border-border bg-white' : 'bg-brand text-white']">
        <AppIcon :name="link.icon" :class="link.icon?.startsWith('upload:') ? 'size-7' : 'size-[18px]'" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ name }}</span>
        <span class="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-ink-2">
          <template v-if="locked">
            <span class="inline-flex min-w-0 items-center gap-1.5 text-ink-3"><Lock class="size-3.5 shrink-0" /> <span class="truncate">{{ t('dashboard.noAccess') }}</span></span>
          </template>
          <template v-else>
            <StatusDot :status="link.statusCode" class="shrink-0" /> <span class="truncate">{{ statusText }}</span>
          </template>
        </span>
      </span>
      <span v-if="link.launchApp" class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] ring-[hsl(var(--primary)/0.25)]">APP</span>
      <span
        v-if="link.environment"
        :class="['inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset', envColorClasses(link.envColor).badge]"
      >
        <span :class="['size-1.5 rounded-full', envColorClasses(link.envColor).dot]"></span>{{ link.environment }}
      </span>
      <button
        v-if="!locked"
        type="button"
        :aria-label="localFavorite ? t('dashboard.favoriteRemove') : t('dashboard.favoriteAdd')"
        :title="localFavorite ? t('dashboard.favoriteRemove') : t('dashboard.favoriteAdd')"
        :class="['shrink-0 rounded-full p-0.5 transition-colors focus:outline-none', localFavorite ? 'text-amber-400' : 'text-ink-3 hover:text-amber-400']"
        @click="onStarClick"
      >
        <Star :class="['size-4', localFavorite ? 'fill-current' : '']" />
      </button>
    </GlassCard>
  </a>
</template>
