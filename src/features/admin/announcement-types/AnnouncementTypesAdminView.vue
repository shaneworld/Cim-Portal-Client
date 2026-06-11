<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, AlertTriangle, RotateCw } from 'lucide-vue-next'
import { listAnnouncementTypes, deleteAnnouncementType } from '@/lib/api/announcementTypes'
import type { AnnouncementType } from '@/lib/api/announcementTypes'
import { colorClasses } from '@/lib/ui/announcementColor'
import { useLocale } from '@/lib/i18n/useLocale'
import { useToastStore } from '@/stores/toast'
import { usePagination } from '@/lib/composables/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import Button from '@/lib/ui/Button.vue'
import Badge from '@/lib/ui/Badge.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
import Pagination from '@/lib/ui/Pagination.vue'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import AnnouncementTypeFormModal from './AnnouncementTypeFormModal.vue'

const { t, pick } = useLocale()
const toast = useToastStore()

const items = ref<AnnouncementType[]>([])
const rowsPerPage = ref(DEFAULT_PAGE_SIZE)
const { page, paged, total, pageSize } = usePagination(items, rowsPerPage)
const loading = ref(true)
const error = ref(false)
const formOpen = ref(false)
const editing = ref<AnnouncementType | null>(null)
const confirmOpen = ref(false)
const pending = ref<AnnouncementType | null>(null)

async function load() {
  loading.value = true
  error.value = false
  try {
    items.value = await listAnnouncementTypes()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function openCreate() { editing.value = null; formOpen.value = true }
function openEdit(a: AnnouncementType) { editing.value = a; formOpen.value = true }
function askDelete(a: AnnouncementType) { pending.value = a; confirmOpen.value = true }

async function doDelete() {
  if (!pending.value) return
  try {
    await deleteAnnouncementType(pending.value.id)
    toast.push({ type: 'success', message: t('common.deleted') })
    await load()
  } catch {
    toast.push({ type: 'error', message: t('common.deleteFailed') })
  } finally {
    confirmOpen.value = false
    pending.value = null
  }
}

onMounted(load)
</script>

<template>
  <AdminPanel :title="t('admin.announcementTypes.title')" v-model:page-size="rowsPerPage">
    <template #actions>
      <Button @click="openCreate"><Plus class="size-4" /> {{ t('admin.announcementTypes.new') }}</Button>
    </template>

    <div v-if="loading" class="space-y-2 p-4"><Skeleton v-for="n in 5" :key="n" /></div>
    <div v-else-if="error" class="p-8 text-center">
      <AlertTriangle class="mx-auto size-9 text-rose-500" />
      <p class="mt-2 text-rose-500">{{ t('dashboard.error') }}</p>
      <Button class="mx-auto mt-3" @click="load"><RotateCw class="size-4" /> {{ t('common.retry') }}</Button>
    </div>
    <template v-else>
      <div class="divide-y divide-border/60">
        <div v-for="a in paged" :key="a.id" class="flex h-16 items-center gap-3 px-3.5">
          <!-- icon chip -->
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-lg"
            :class="colorClasses(a.color).chip"
          >
            <AppIcon :name="a.icon" class="size-4" />
          </span>
          <!-- code -->
          <span class="w-28 shrink-0 truncate font-mono text-xs text-ink-2">{{ a.code }}</span>
          <!-- labels -->
          <span class="min-w-0 flex-1 truncate text-sm">
            {{ pick(a, 'label') }}
            <span class="text-ink-3"> / {{ a.labelZh }} · {{ a.labelEn }}</span>
          </span>
          <!-- color swatch -->
          <span
            class="hidden w-20 shrink-0 rounded px-1.5 py-0.5 text-center text-[11px] font-medium sm:block"
            :class="colorClasses(a.color).tag"
          >{{ a.color }}</span>
          <!-- sortOrder -->
          <span class="hidden w-10 shrink-0 text-center text-xs text-ink-3 md:block">{{ a.sortOrder }}</span>
          <!-- active -->
          <Badge :tone="a.active ? 'go' : 'muted'">{{ a.active ? t('common.enabled') : t('common.disabled') }}</Badge>
          <!-- actions -->
          <span class="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" :data-testid="`at-edit-${a.id}`" @click="openEdit(a)"><Pencil class="size-4" /></Button>
            <Button variant="ghost" size="icon" :data-testid="`at-del-${a.id}`" @click="askDelete(a)"><Trash2 class="size-4 text-rose-500" /></Button>
          </span>
        </div>
      </div>
      <div v-if="!items.length" class="p-8 text-center text-ink-3">{{ t('admin.announcementTypes.empty') }}</div>
    </template>

    <template v-if="total > pageSize" #footer>
      <Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />
    </template>
  </AdminPanel>

  <AnnouncementTypeFormModal v-model:open="formOpen" :value="editing" @saved="load" />
  <ConfirmDialog
    v-model:open="confirmOpen"
    :title="t('admin.announcementTypes.deleteTitle')"
    :message="t('admin.announcementTypes.deleteMessage', { code: pending?.code })"
    @confirm="doDelete"
    @cancel="confirmOpen = false"
  />
</template>
