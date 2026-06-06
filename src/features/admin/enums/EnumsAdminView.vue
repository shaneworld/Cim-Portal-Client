<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, AlertTriangle, RotateCw } from 'lucide-vue-next'
import { listEnumValues, deleteEnumValue } from '@/lib/api/admin'
import type { EnumValue, EnumCategory } from '@/lib/api/types'
import { useToastStore } from '@/stores/toast'
import { usePagination } from '@/lib/composables/usePagination'
import Button from '@/lib/ui/Button.vue'
import Badge from '@/lib/ui/Badge.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import ConfirmDialog from '@/lib/ui/ConfirmDialog.vue'
import Pagination from '@/lib/ui/Pagination.vue'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import EnumFormModal from './EnumFormModal.vue'

const CATEGORIES: { code: EnumCategory; label: string }[] = [
  { code: 'DEPARTMENT', label: '部门' },
  { code: 'ROLE', label: '角色' },
  { code: 'LINK_CATEGORY', label: '链接分类' },
  { code: 'LINK_STATUS', label: '链接状态' },
]

const toast = useToastStore()
const active = ref<EnumCategory>('DEPARTMENT')
const values = ref<EnumValue[]>([])
const { page, paged, total, pageSize, reset } = usePagination(values, 10)
const loading = ref(true)
const error = ref(false)
const formOpen = ref(false)
const editing = ref<EnumValue | null>(null)
const confirmOpen = ref(false)
const pending = ref<EnumValue | null>(null)

async function load() {
  loading.value = true
  error.value = false
  try {
    values.value = await listEnumValues(active.value)
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function switchTo(c: EnumCategory) {
  if (c !== active.value) {
    active.value = c
    reset()
    load()
  }
}

function openCreate() {
  editing.value = null
  formOpen.value = true
}

function openEdit(v: EnumValue) {
  editing.value = v
  formOpen.value = true
}

function askDelete(v: EnumValue) {
  pending.value = v
  confirmOpen.value = true
}

async function doDelete() {
  if (!pending.value) return
  try {
    await deleteEnumValue(active.value, pending.value.id)
    toast.push({ type: 'success', message: '已删除' })
    await load()
  } catch {
    toast.push({ type: 'error', message: '删除失败' })
  } finally {
    confirmOpen.value = false
    pending.value = null
  }
}

onMounted(load)
</script>

<template>
  <AdminPanel title="枚举管理">
    <template #actions>
      <Button @click="openCreate"><Plus class="size-4" /> 新建</Button>
    </template>

    <template #toolbar>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="c in CATEGORIES"
          :key="c.code"
          type="button"
          class="rounded-xl px-3 py-1.5 text-sm font-medium transition"
          :class="active === c.code ? 'bg-brand text-white shadow' : 'glass-strong text-ink-2 hover:text-[hsl(var(--ink))]'"
          @click="switchTo(c.code)"
        >{{ c.label }}</button>
      </div>
    </template>

    <div v-if="loading" class="space-y-2 p-4"><Skeleton v-for="n in 5" :key="n" /></div>
    <div v-else-if="error" class="p-8 text-center">
      <AlertTriangle class="mx-auto size-9 text-rose-500" />
      <p class="mt-2 text-rose-500">加载失败</p>
      <Button class="mx-auto mt-3" @click="load"><RotateCw class="size-4" /> 重试</Button>
    </div>
    <template v-else>
      <div class="divide-y divide-border/60">
        <div v-for="v in paged" :key="v.id" class="flex items-center gap-3 p-3.5">
          <span class="w-32 shrink-0 truncate font-mono text-xs text-ink-2">{{ v.code }}</span>
          <span class="min-w-0 flex-1 truncate text-sm">
            {{ v.labelZh }} <span class="text-ink-3">/ {{ v.labelEn }}</span>
          </span>
          <span class="hidden w-12 shrink-0 text-center text-xs text-ink-3 sm:block">{{ v.sortOrder }}</span>
          <Badge :tone="v.active ? 'go' : 'muted'">{{ v.active ? '启用' : '停用' }}</Badge>
          <span class="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" :data-testid="`enum-edit-${v.id}`" @click="openEdit(v)"><Pencil class="size-4" /></Button>
            <Button variant="ghost" size="icon" :data-testid="`enum-del-${v.id}`" @click="askDelete(v)"><Trash2 class="size-4 text-rose-500" /></Button>
          </span>
        </div>
      </div>
      <div v-if="!values.length" class="p-8 text-center text-ink-3">该分类暂无枚举值</div>
    </template>

    <template v-if="total > pageSize" #footer>
      <Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />
    </template>
  </AdminPanel>

  <EnumFormModal v-model:open="formOpen" :category="active" :value="editing" @saved="load" />
  <ConfirmDialog
    v-model:open="confirmOpen"
    title="删除枚举值"
    :message="`确认删除「${pending?.code}」?删除可能影响仍在使用该 code 的链接/授权。`"
    @confirm="doDelete"
    @cancel="confirmOpen = false"
  />
</template>
