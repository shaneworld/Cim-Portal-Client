<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Pencil, Trash2, AlertTriangle, RotateCw, Pin } from 'lucide-vue-next'
import { listAdminAnnouncements, deleteAnnouncement } from '@/lib/api/announcements'
import type { Announcement } from '@/lib/api/announcements'
import { getSecuritySettings, updateSecuritySettings } from '@/lib/api/admin'
import { colorClasses } from '@/lib/ui/announcementColor'
import { useLocale } from '@/lib/i18n/useLocale'
import { useToastStore } from '@/stores/toast'
import { usePagination } from '@/lib/composables/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import Button from '@/lib/ui/Button.vue'
import Badge from '@/lib/ui/Badge.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import Switch from '@/lib/ui/Switch.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
import Pagination from '@/lib/ui/Pagination.vue'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import AnnouncementFormModal from './AnnouncementFormModal.vue'

const { t, pick } = useLocale()
const toast = useToastStore()

const items = ref<Announcement[]>([])
const rowsPerPage = ref(DEFAULT_PAGE_SIZE)
const { page, paged, total, pageSize } = usePagination(items, rowsPerPage)
const loading = ref(true)
const error = ref(false)
const formOpen = ref(false)
const editing = ref<Announcement | null>(null)
const confirmOpen = ref(false)
const pending = ref<Announcement | null>(null)

// Announcements feature toggle
const featureEnabled = ref(false)
const featureLoading = ref(true)
const featureSaving = ref(false)

async function loadFeature() {
  featureLoading.value = true
  try {
    const s = await getSecuritySettings()
    featureEnabled.value = s.announcementsEnabled ?? false
  } catch {
    // ignore
  } finally {
    featureLoading.value = false
  }
}

async function toggleFeature(val: boolean) {
  featureSaving.value = true
  try {
    const s = await getSecuritySettings()
    await updateSecuritySettings({
      ssoEnabled: s.ssoEnabled,
      issuerUri: s.issuerUri,
      clientId: s.clientId,
      scopes: s.scopes,
      usernameClaim: s.usernameClaim,
      announcementsEnabled: val,
      dutyLinesEnabled: s.dutyLinesEnabled,
    })
    featureEnabled.value = val
    toast.push({ type: 'success', message: t('common.updated') })
  } catch {
    toast.push({ type: 'error', message: t('common.saveFailed') })
  } finally {
    featureSaving.value = false
  }
}

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

onMounted(() => { loadFeature(); load() })
</script>

<template>
  <AdminPanel :title="t('admin.announcements.title')" v-model:page-size="rowsPerPage">
    <template #actions>
      <Button @click="openCreate"><Plus class="size-4" /> {{ t('admin.announcements.new') }}</Button>
    </template>

    <template #toolbar>
      <div class="flex items-center gap-2.5">
        <Switch
          :model-value="featureEnabled"
          :disabled="featureLoading || featureSaving"
          data-testid="announcements-enabled"
          @update:model-value="toggleFeature"
        />
        <span class="text-sm text-ink-2">{{ t('admin.announcements.featureEnabled') }}</span>
      </div>
    </template>

    <div v-if="loading" class="space-y-2 p-4"><Skeleton v-for="n in 5" :key="n" /></div>
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
          class="flex min-h-[3.5rem] items-center gap-3 px-3.5 py-2"
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
          <!-- active -->
          <Badge :tone="a.active ? 'go' : 'muted'">{{ a.active ? t('common.enabled') : t('common.disabled') }}</Badge>
          <!-- actions -->
          <span class="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" :data-testid="`ann-edit-${a.id}`" @click="openEdit(a)"><Pencil class="size-4" /></Button>
            <Button variant="ghost" size="icon" :data-testid="`ann-del-${a.id}`" @click="askDelete(a)"><Trash2 class="size-4 text-rose-500" /></Button>
          </span>
        </div>
      </div>
      <div v-if="!items.length" class="p-8 text-center text-ink-3">{{ t('admin.announcements.empty') }}</div>
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
