<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Users, AlertTriangle, RotateCw } from 'lucide-vue-next'
import { listGroups, deleteGroup, type Group } from '@/lib/api/permissionGroups'
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
import GroupFormModal from './GroupFormModal.vue'
import GroupMembersModal from './GroupMembersModal.vue'

const { t } = useLocale()
const toast = useToastStore()

const groups = ref<Group[]>([])
const rowsPerPage = ref(DEFAULT_PAGE_SIZE)
const { page, paged, total, pageSize, reset } = usePagination(groups, rowsPerPage)
const loading = ref(true)
const error = ref(false)

const formOpen = ref(false)
const editing = ref<Group | null>(null)

const membersOpen = ref(false)
const membersTarget = ref<Group | null>(null)

const confirmOpen = ref(false)
const pending = ref<Group | null>(null)

async function load() {
  loading.value = true
  error.value = false
  try {
    groups.value = await listGroups()
    reset()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(g: Group) {
  editing.value = g
  formOpen.value = true
}

function openMembers(g: Group) {
  membersTarget.value = g
  membersOpen.value = true
}

function askDelete(g: Group) {
  pending.value = g
  confirmOpen.value = true
}

async function doDelete() {
  if (!pending.value) return
  try {
    await deleteGroup(pending.value.id)
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
  <AdminPanel :title="t('admin.permissionGroups.title')" v-model:page-size="rowsPerPage">
    <template #actions>
      <Button @click="openCreate"><Plus class="size-4" /> {{ t('admin.permissionGroups.new') }}</Button>
    </template>

    <div v-if="loading" class="space-y-2 p-4"><Skeleton v-for="n in 5" :key="n" /></div>
    <div v-else-if="error" class="p-8 text-center">
      <AlertTriangle class="mx-auto size-9 text-rose-500" />
      <p class="mt-2 text-rose-500">{{ t('dashboard.error') }}</p>
      <Button class="mx-auto mt-3" @click="load"><RotateCw class="size-4" /> {{ t('common.retry') }}</Button>
    </div>
    <template v-else>
      <div class="divide-y divide-border/60">
        <div v-for="g in paged" :key="g.id" class="flex h-16 items-center gap-3 px-3.5">
          <span class="w-32 shrink-0 truncate font-mono text-xs text-ink-2">{{ g.code }}</span>
          <span class="min-w-0 flex-1 truncate text-sm">
            {{ g.nameZh }} <span class="text-ink-3">/ {{ g.nameEn }}</span>
          </span>
          <Badge :tone="g.active ? 'go' : 'muted'">{{ g.active ? t('common.enabled') : t('common.disabled') }}</Badge>
          <span class="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" :title="t('admin.permissionGroups.membersTitle')" @click="openMembers(g)">
              <Users class="size-4" />
            </Button>
            <Button variant="ghost" size="icon" :data-testid="`group-edit-${g.id}`" @click="openEdit(g)">
              <Pencil class="size-4" />
            </Button>
            <Button variant="ghost" size="icon" :data-testid="`group-del-${g.id}`" @click="askDelete(g)">
              <Trash2 class="size-4 text-rose-500" />
            </Button>
          </span>
        </div>
      </div>
      <div v-if="!groups.length" class="p-8 text-center text-ink-3">{{ t('admin.permissionGroups.empty') }}</div>
    </template>

    <template v-if="total > pageSize" #footer>
      <Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />
    </template>
  </AdminPanel>

  <GroupFormModal v-model:open="formOpen" :group="editing" @saved="load" />
  <GroupMembersModal v-model:open="membersOpen" :group="membersTarget" @saved="load" />
  <ConfirmDialog
    v-model:open="confirmOpen"
    :title="t('admin.permissionGroups.deleteTitle')"
    :message="t('admin.permissionGroups.deleteMessage', { code: pending?.code })"
    @confirm="doDelete"
    @cancel="confirmOpen = false"
  />
</template>
