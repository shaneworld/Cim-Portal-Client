<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Plus, Pencil, Trash2, AlertTriangle, RotateCw, Pin } from 'lucide-vue-next'
import { listAdminAnnouncements, deleteAnnouncement } from '@/lib/api/announcements'
import type { Announcement } from '@/lib/api/announcements'
import { colorClasses } from '@/lib/ui/announcementColor'
import { useLocale } from '@/lib/i18n/useLocale'
import { useToastStore } from '@/stores/toast'
import { usePagination } from '@/lib/composables/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import Button from '@/lib/ui/Button.vue'
import Badge from '@/lib/ui/Badge.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
import Pagination from '@/lib/ui/Pagination.vue'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import AnnouncementFormModal from './AnnouncementFormModal.vue'

const { t, pick, locale } = useLocale()
const toast = useToastStore()

const TABS = [
  { code: 'active' as const, labelKey: 'admin.announcements.tabActive', testid: 'ann-tab-active' },
  { code: 'history' as const, labelKey: 'admin.announcements.tabHistory', testid: 'ann-tab-history' },
]

const items = ref<Announcement[]>([])
const tab = ref<'active' | 'history'>('active')
const visible = computed(() =>
  tab.value === 'active'
    ? items.value.filter((a) => a.active === true)
    : items.value.filter((a) => a.active === false),
)
const rowsPerPage = ref(DEFAULT_PAGE_SIZE)
const { page, paged, total, pageSize, reset } = usePagination(visible, rowsPerPage)
watch(tab, () => reset())
const loading = ref(true)
const error = ref(false)
const formOpen = ref(false)
const editing = ref<Announcement | null>(null)
const confirmOpen = ref(false)
const pending = ref<Announcement | null>(null)

async function load() {
  loading.value = true
  error.value = false
  try {
    items.value = await listAdminAnnouncements()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function openCreate() { editing.value = null; formOpen.value = true }
function openEdit(a: Announcement) { editing.value = a; formOpen.value = true }
function askDelete(a: Announcement) { pending.value = a; confirmOpen.value = true }

async function doDelete() {
  if (!pending.value) return
  try {
    await deleteAnnouncement(pending.value.id)
    toast.push({ type: 'success', message: t('common.deleted') })
    await load()
  } catch {
    toast.push({ type: 'error', message: t('common.deleteFailed') })
  } finally {
    confirmOpen.value = false
    pending.value = null
  }
}

const windowText = computed(() => (a: Announcement) => {
  if (!a.startsAt && !a.endsAt) return '—'
  const fmt = (s?: string) => s ? s.slice(0, 10) : '∞'
  return `${fmt(a.startsAt)} – ${fmt(a.endsAt)}`
})

function fmtClosed(s?: string | null) {
  return s ? new Date(s).toLocaleString(locale.value === 'zh' ? 'zh-CN' : 'en-US') : ''
}

function isScheduled(a: Announcement) {
  return a.active && !!a.startsAt && new Date(a.startsAt).getTime() > Date.now()
}

onMounted(load)
</script>

<template>
  <AdminPanel :title="t('admin.announcements.title')" v-model:page-size="rowsPerPage">
    <template #actions>
      <Button v-if="tab === 'active'" @click="openCreate"><Plus class="size-4" /> {{ t('admin.announcements.new') }}</Button>
    </template>

    <template #toolbar>
      <div class="flex flex-wrap gap-1.5" role="tablist">
        <button
          v-for="tb in TABS"
          :key="tb.code"
          type="button"
          role="tab"
          :aria-selected="tab === tb.code"
          :data-testid="tb.testid"
          class="rounded-xl border border-transparent px-3 py-1.5 text-sm font-medium transition"
          :class="tab === tb.code ? 'bg-brand text-white shadow' : 'glass-strong text-ink-2 hover:text-[hsl(var(--ink))]'"
          @click="tab = tb.code"
        >{{ t(tb.labelKey) }}</button>
      </div>
    </template>

    <div v-if="loading" class="space-y-2 px-5 py-4"><Skeleton v-for="n in 5" :key="n" /></div>
    <div v-else-if="error" class="p-8 text-center">
      <AlertTriangle class="mx-auto size-9 text-rose-500" />
      <p class="mt-2 text-rose-500">{{ t('dashboard.error') }}</p>
      <Button class="mx-auto mt-3" @click="load"><RotateCw class="size-4" /> {{ t('common.retry') }}</Button>
    </div>
    <template v-else>
      <div class="divide-y divide-border/60">
        <div
          v-for="a in paged"
          :key="a.id"
          class="flex min-h-[3.5rem] items-center gap-3 px-5 py-2"
        >
          <!-- type colored tag -->
          <span
            class="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium"
            :class="colorClasses(a.typeColor).tag"
          >{{ pick(a, 'typeLabel') }}</span>
          <!-- title -->
          <span class="min-w-0 flex-1 truncate text-sm">
            {{ pick(a, 'title') }}
          </span>
          <!-- pinned -->
          <Pin v-if="a.pinned" class="size-3.5 shrink-0 text-ink-3" />
          <!-- window -->
          <span class="hidden w-28 shrink-0 text-center text-xs text-ink-3 md:block">{{ windowText(a) }}</span>
          <!-- history close info -->
          <span v-if="tab === 'history'" class="shrink-0 text-right text-xs text-ink-3">
            <Badge :tone="a.closedAt ? 'caution' : 'muted'">{{ a.closedAt ? t('admin.announcements.closedExpired') : t('admin.announcements.closedDisabled') }}</Badge>
            <span v-if="a.closedAt" class="ml-2 hidden md:inline">{{ t('admin.announcements.closedAtLabel') }}: {{ fmtClosed(a.closedAt) }}</span>
          </span>
          <!-- active -->
          <Badge v-else-if="isScheduled(a)" tone="caution">{{ t('admin.announcements.scheduled') }}</Badge>
          <Badge v-else :tone="a.active ? 'go' : 'muted'">{{ a.active ? t('common.enabled') : t('common.disabled') }}</Badge>
          <!-- actions -->
          <span class="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" :data-testid="`ann-edit-${a.id}`" @click="openEdit(a)"><Pencil class="size-4" /></Button>
            <Button variant="ghost" size="icon" :data-testid="`ann-del-${a.id}`" @click="askDelete(a)"><Trash2 class="size-4 text-rose-500" /></Button>
          </span>
        </div>
      </div>
      <div v-if="!visible.length" class="p-8 text-center text-ink-3">{{ t('admin.announcements.empty') }}</div>
    </template>

    <template v-if="total > pageSize" #footer>
      <Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />
    </template>
  </AdminPanel>

  <AnnouncementFormModal v-model:open="formOpen" :value="editing" @saved="load" />
  <ConfirmDialog
    v-model:open="confirmOpen"
    :title="t('admin.announcements.deleteTitle')"
    :message="t('admin.announcements.deleteMessage', { title: pending ? pick(pending, 'title') : '' })"
    @confirm="doDelete"
    @cancel="confirmOpen = false"
  />
</template>
