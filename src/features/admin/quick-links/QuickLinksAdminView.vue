<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, AlertTriangle, RotateCw } from 'lucide-vue-next'
import { listAdminQuickLinks, deleteQuickLink } from '@/lib/api/quickLinks'
import type { QuickLink } from '@/lib/api/quickLinks'
import { useLocale } from '@/lib/i18n/useLocale'
import { useToastStore } from '@/stores/toast'
import { usePagination } from '@/lib/composables/usePagination'
import { DEFAULT_PAGE_SIZE } from '@/constants'
import Button from '@/lib/ui/Button.vue'
import Badge from '@/lib/ui/Badge.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
import Pagination from '@/lib/ui/Pagination.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import QuickLinkFormModal from './QuickLinkFormModal.vue'

const { t, pick } = useLocale()
const toast = useToastStore()

const items = ref<QuickLink[]>([])
const rowsPerPage = ref(DEFAULT_PAGE_SIZE)
const { page, paged, total, pageSize } = usePagination(items, rowsPerPage)
const loading = ref(true)
const error = ref(false)
const formOpen = ref(false)
const editing = ref<QuickLink | null>(null)
const confirmOpen = ref(false)
const pending = ref<QuickLink | null>(null)

async function load() {
  loading.value = true
  error.value = false
  try {
    items.value = await listAdminQuickLinks()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function openCreate() { editing.value = null; formOpen.value = true }
function openEdit(q: QuickLink) { editing.value = q; formOpen.value = true }
function askDelete(q: QuickLink) { pending.value = q; confirmOpen.value = true }

async function doDelete() {
  if (!pending.value) return
  try {
    await deleteQuickLink(pending.value.id)
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
  <AdminPanel :title="t('admin.quickLinks.title')" v-model:page-size="rowsPerPage">
    <template #actions>
      <Button @click="openCreate"><Plus class="size-4" /> {{ t('admin.quickLinks.new') }}</Button>
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
          v-for="q in paged"
          :key="q.id"
          class="flex min-h-[3.5rem] items-center gap-3 px-3.5 py-2"
        >
          <!-- icon -->
          <AppIcon :name="q.icon || 'external-link'" class="size-4 shrink-0 text-ink-3" />
          <!-- label -->
          <span class="min-w-0 flex-1 truncate text-sm">{{ pick(q, 'label') }}</span>
          <!-- url -->
          <span class="hidden w-56 shrink-0 truncate text-right text-sm text-ink-3 md:block">{{ q.url }}</span>
          <!-- sort -->
          <span class="hidden w-12 shrink-0 text-center text-xs text-ink-3 md:block">{{ q.sortOrder }}</span>
          <!-- active -->
          <Badge :tone="q.active ? 'go' : 'muted'">{{ q.active ? t('common.enabled') : t('common.disabled') }}</Badge>
          <!-- actions -->
          <span class="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" :data-testid="`ql-edit-${q.id}`" @click="openEdit(q)"><Pencil class="size-4" /></Button>
            <Button variant="ghost" size="icon" :data-testid="`ql-del-${q.id}`" @click="askDelete(q)"><Trash2 class="size-4 text-rose-500" /></Button>
          </span>
        </div>
      </div>
      <div v-if="!items.length" class="p-8 text-center text-ink-3">{{ t('admin.quickLinks.empty') }}</div>
    </template>

    <template v-if="total > pageSize" #footer>
      <Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />
    </template>
  </AdminPanel>

  <QuickLinkFormModal v-model:open="formOpen" :value="editing" @saved="load" />
  <ConfirmDialog
    v-model:open="confirmOpen"
    :title="t('admin.quickLinks.deleteTitle')"
    :message="t('admin.quickLinks.deleteMessage', { label: pending ? pick(pending, 'label') : '' })"
    @confirm="doDelete"
    @cancel="confirmOpen = false"
  />
</template>
