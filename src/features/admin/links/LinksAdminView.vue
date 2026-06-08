<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, AlertTriangle, RotateCw } from 'lucide-vue-next'
import { listLinks, deleteLink, type AdminLink } from '@/lib/api/admin'
import { useLocale } from '@/lib/i18n/useLocale'
import { useToastStore } from '@/stores/toast'
import { usePagination } from '@/lib/composables/usePagination'
import { DEFAULT_PAGE_SIZE, LINK_ENVS } from '@/constants'
import Button from '@/lib/ui/Button.vue'
import StatusDot from '@/lib/ui/StatusDot.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
import Pagination from '@/lib/ui/Pagination.vue'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import LinkFormModal from './LinkFormModal.vue'

const { pick, t } = useLocale()
const toast = useToastStore()
const links = ref<AdminLink[]>([]); const loading = ref(true); const error = ref(false)
const rowsPerPage = ref(DEFAULT_PAGE_SIZE)
const { page, paged, total, pageSize } = usePagination(links, rowsPerPage)
const formOpen = ref(false); const editing = ref<AdminLink | null>(null)
const confirmOpen = ref(false); const pendingDelete = ref<AdminLink | null>(null)

async function load() { loading.value = true; error.value = false; try { links.value = await listLinks() } catch { error.value = true } finally { loading.value = false } }
function openCreate() { editing.value = null; formOpen.value = true }
function openEdit(l: AdminLink) { editing.value = l; formOpen.value = true }
function askDelete(l: AdminLink) { pendingDelete.value = l; confirmOpen.value = true }
async function doDelete() {
  if (!pendingDelete.value) return
  try { await deleteLink(pendingDelete.value.id); toast.push({ type: 'success', message: t('common.deleted') }); await load() }
  catch { toast.push({ type: 'error', message: t('common.deleteFailed') }) }
  finally { confirmOpen.value = false; pendingDelete.value = null }
}
onMounted(load)
</script>
<template>
  <AdminPanel :title="t('admin.links.title')" v-model:page-size="rowsPerPage">
    <template #actions>
      <Button @click="openCreate"><Plus class="size-4" /> {{ t('admin.links.new') }}</Button>
    </template>

    <div v-if="loading" class="space-y-2 p-4"><Skeleton v-for="n in 6" :key="n" /></div>
    <div v-else-if="error" class="p-8 text-center">
      <AlertTriangle class="mx-auto size-9 text-rose-500" /><p class="mt-2 text-rose-500">{{ t('dashboard.error') }}</p>
      <Button class="mx-auto mt-3" @click="load"><RotateCw class="size-4" /> {{ t('common.retry') }}</Button>
    </div>
    <template v-else>
      <div class="divide-y divide-border/60">
        <div v-for="l in paged" :key="l.id" class="flex h-16 items-center gap-3 px-3.5">
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold">{{ pick(l, 'name') }}<span v-if="l.launchApp" class="ml-1.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] ring-[hsl(var(--primary)/0.25)]">APP</span><span v-if="l.environment" :class="['ml-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset', LINK_ENVS[l.environment].badge]"><span :class="['size-1.5 rounded-full', LINK_ENVS[l.environment].dot]"></span>{{ l.environment }}</span></span>
          </span>
          <span class="hidden w-24 shrink-0 text-xs text-ink-2 sm:block">{{ l.categoryCode }}</span>
          <span class="hidden w-28 shrink-0 items-center gap-1.5 text-xs text-ink-2 sm:flex"><StatusDot :status="l.statusCode" /> {{ l.statusCode }}</span>
          <span class="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" :data-testid="`edit-${l.id}`" @click="openEdit(l)"><Pencil class="size-4" /></Button>
            <Button variant="ghost" size="icon" :data-testid="`del-${l.id}`" @click="askDelete(l)"><Trash2 class="size-4 text-rose-500" /></Button>
          </span>
        </div>
      </div>
      <div v-if="!links.length" class="p-8 text-center text-ink-3">{{ t('admin.links.empty') }}</div>
    </template>

    <template v-if="total > pageSize" #footer>
      <Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />
    </template>
  </AdminPanel>

  <LinkFormModal v-model:open="formOpen" :link="editing" @saved="load" />
  <ConfirmDialog v-model:open="confirmOpen" :title="t('admin.links.deleteTitle')" :message="t('admin.links.deleteMessage', { name: pendingDelete ? pick(pendingDelete, 'name') : '' })" @confirm="doDelete" @cancel="confirmOpen = false" />
</template>
