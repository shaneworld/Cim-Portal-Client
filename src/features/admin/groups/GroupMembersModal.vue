<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Button from '@/lib/ui/Button.vue'
import Input from '@/lib/ui/Input.vue'
import { getMembers, replaceMembers, type Group } from '@/lib/api/permissionGroups'
import { request } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'

interface UserRow {
  employeeId: string
  displayNameZh: string
  displayNameEn: string
  departmentCode: string
  active: boolean
}

const props = defineProps<{ open: boolean; group: Group | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const { t, pick } = useLocale()

const allUsers = ref<UserRow[]>([])
const selected = ref<Set<string>>(new Set())
const searchQ = ref('')
const loading = ref(false)
const saving = ref(false)

const filtered = computed(() => {
  const q = searchQ.value.trim().toLowerCase()
  if (!q) return allUsers.value
  return allUsers.value.filter(
    (u) =>
      u.employeeId.toLowerCase().includes(q) ||
      u.displayNameZh.toLowerCase().includes(q) ||
      u.displayNameEn.toLowerCase().includes(q),
  )
})

watch(
  () => props.open,
  async (o) => {
    if (!o || !props.group) return
    loading.value = true
    searchQ.value = ''
    try {
      const [users, memberIds] = await Promise.all([
        request<UserRow[]>('GET', '/api/admin/users'),
        getMembers(props.group.id),
      ])
      allUsers.value = users
      selected.value = new Set(memberIds)
    } catch {
      toast.push({ type: 'error', message: t('common.saveFailed') })
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

function toggle(employeeId: string) {
  if (selected.value.has(employeeId)) selected.value.delete(employeeId)
  else selected.value.add(employeeId)
}

async function save() {
  if (!props.group) return
  saving.value = true
  try {
    await replaceMembers(props.group.id, [...selected.value])
    toast.push({ type: 'success', message: t('common.saved') })
    emit('saved')
    emit('update:open', false)
  } catch {
    toast.push({ type: 'error', message: t('common.saveFailed') })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Modal
    size="lg"
    :open="open"
    :title="t('admin.permissionGroups.membersTitle') + (group ? ` — ${group.code}` : '')"
    @update:open="(v) => emit('update:open', v)"
  >
    <div class="space-y-3">
      <p class="text-xs text-ink-3">{{ t('admin.permissionGroups.membersHint') }}</p>
      <Input
        :model-value="searchQ"
        :placeholder="t('common.search')"
        @update:model-value="(v) => (searchQ = v)"
      />
      <div v-if="loading" class="py-6 text-center text-sm text-ink-3">{{ t('common.loading') }}</div>
      <div v-else-if="!filtered.length" class="py-6 text-center text-sm text-ink-3">
        {{ t('admin.permissionGroups.membersEmpty') }}
      </div>
      <div v-else class="max-h-72 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border">
        <label
          v-for="u in filtered"
          :key="u.employeeId"
          class="flex cursor-pointer items-center gap-3 px-3 py-2 transition hover:bg-[hsl(var(--primary)/0.06)]"
        >
          <input
            type="checkbox"
            class="size-4 rounded accent-[hsl(var(--primary))]"
            :checked="selected.has(u.employeeId)"
            @change="toggle(u.employeeId)"
          />
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium">{{ pick(u, 'displayName') }}</span>
            <span class="block text-xs text-ink-3">{{ u.employeeId }}{{ u.departmentCode ? ' · ' + u.departmentCode : '' }}</span>
          </span>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-xs"
            :class="u.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300'"
          >{{ u.active ? t('common.enabled') : t('common.disabled') }}</span>
        </label>
      </div>
      <p class="text-xs text-ink-3">
        {{ selected.size }} / {{ allUsers.length }}
      </p>
    </div>
    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button :disabled="saving || loading" @click="save">{{ t('admin.permissionGroups.saveMembers') }}</Button>
    </template>
  </Modal>
</template>
