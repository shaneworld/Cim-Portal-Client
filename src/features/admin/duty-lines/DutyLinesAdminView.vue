<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, AlertTriangle, RotateCw, Phone } from 'lucide-vue-next'
import { listAdminDutyLines, deleteDutyLine } from '@/lib/api/dutyLines'
import type { DutyLine } from '@/lib/api/dutyLines'
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
import DutyLineFormModal from './DutyLineFormModal.vue'

const { t, pick } = useLocale()
const toast = useToastStore()

const items = ref<DutyLine[]>([])
const rowsPerPage = ref(DEFAULT_PAGE_SIZE)
const { page, paged, total, pageSize } = usePagination(items, rowsPerPage)
const loading = ref(true)
const error = ref(false)
const formOpen = ref(false)
const editing = ref<DutyLine | null>(null)
const confirmOpen = ref(false)
const pending = ref<DutyLine | null>(null)

async function load() {
  loading.value = true
  error.value = false
  try {
    items.value = await listAdminDutyLines()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function openCreate() { editing.value = null; formOpen.value = true }
function openEdit(d: DutyLine) { editing.value = d; formOpen.value = true }
function askDelete(d: DutyLine) { pending.value = d; confirmOpen.value = true }

async function doDelete() {
  if (!pending.value) return
  try {
    await deleteDutyLine(pending.value.id)
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
  <AdminPanel :title="t('admin.dutyLines.title')" v-model:page-size="rowsPerPage">
    <template #actions>
      <Button @click="openCreate"><Plus class="size-4" /> {{ t('admin.dutyLines.new') }}</Button>
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
          v-for="d in paged"
          :key="d.id"
          class="flex min-h-[3.5rem] items-center gap-3 px-5 py-2"
        >
          <!-- phone icon -->
          <Phone class="size-4 shrink-0 text-ink-3" />
          <!-- label -->
          <span class="min-w-0 flex-1 truncate text-sm">{{ pick(d, 'label') }}</span>
          <!-- phone number -->
          <span class="hidden w-36 shrink-0 text-right text-sm tabular-nums font-semibold text-ink-1 md:block">{{ d.phone }}</span>
          <!-- sort -->
          <span class="hidden w-12 shrink-0 text-center text-xs text-ink-3 md:block">{{ d.sortOrder }}</span>
          <!-- active -->
          <Badge :tone="d.active ? 'go' : 'muted'">{{ d.active ? t('common.enabled') : t('common.disabled') }}</Badge>
          <!-- actions -->
          <span class="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" :data-testid="`duty-edit-${d.id}`" @click="openEdit(d)"><Pencil class="size-4" /></Button>
            <Button variant="ghost" size="icon" :data-testid="`duty-del-${d.id}`" @click="askDelete(d)"><Trash2 class="size-4 text-rose-500" /></Button>
          </span>
        </div>
      </div>
      <div v-if="!items.length" class="p-8 text-center text-ink-3">{{ t('admin.dutyLines.empty') }}</div>
    </template>

    <template v-if="total > pageSize" #footer>
      <Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />
    </template>
  </AdminPanel>

  <DutyLineFormModal v-model:open="formOpen" :value="editing" @saved="load" />
  <ConfirmDialog
    v-model:open="confirmOpen"
    :title="t('admin.dutyLines.deleteTitle')"
    :message="t('admin.dutyLines.deleteMessage', { label: pending ? pick(pending, 'label') : '' })"
    @confirm="doDelete"
    @cancel="confirmOpen = false"
  />
</template>
