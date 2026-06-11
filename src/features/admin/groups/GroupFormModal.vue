<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Input from '@/lib/ui/Input.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'
import { createGroup, updateGroup, type Group, type GroupInput } from '@/lib/api/permissionGroups'
import { ApiError } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'

const props = defineProps<{ open: boolean; group: Group | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const { t } = useLocale()

const form = reactive<GroupInput>({ code: '', nameZh: '', nameEn: '', active: true })
const fieldErrors = ref<Record<string, string>>({})
const saving = ref(false)

watch(
  () => props.open,
  (o) => {
    if (!o) return
    fieldErrors.value = {}
    if (props.group) {
      Object.assign(form, {
        code: props.group.code,
        nameZh: props.group.nameZh,
        nameEn: props.group.nameEn,
        active: props.group.active,
      })
    } else {
      Object.assign(form, { code: '', nameZh: '', nameEn: '', active: true })
    }
  },
  { immediate: true },
)

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.code.trim()) e.code = t('admin.groupForm.codeRequired')
  if (!form.nameZh.trim()) e.nameZh = t('admin.groupForm.nameZhRequired')
  if (!form.nameEn.trim()) e.nameEn = t('admin.groupForm.nameEnRequired')
  fieldErrors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const input: GroupInput = { ...form }
    if (props.group) await updateGroup(props.group.id, input)
    else await createGroup(input)
    toast.push({ type: 'success', message: props.group ? t('common.updated') : t('common.created') })
    emit('saved')
    emit('update:open', false)
  } catch (err) {
    if (err instanceof ApiError && err.fieldErrors) {
      const e: Record<string, string> = {}
      err.fieldErrors.forEach((fe) => { e[fe.field] = fe.message })
      fieldErrors.value = e
    } else {
      toast.push({ type: 'error', message: t('common.saveFailed') })
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Modal
    size="md"
    :open="open"
    :title="group ? t('admin.groupForm.editTitle') : t('admin.groupForm.createTitle')"
    @update:open="(v) => emit('update:open', v)"
  >
    <div class="space-y-3">
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.groupForm.codeLabel') }}</span>
        <Input
          data-testid="g-code"
          :model-value="form.code"
          :disabled="!!group"
          :placeholder="t('admin.groupForm.codePlaceholder')"
          @update:model-value="(v) => (form.code = v)"
        />
        <span v-if="fieldErrors.code" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.code }}</span>
      </label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.groupForm.nameZhLabel') }}</span>
          <Input data-testid="g-nameZh" :model-value="form.nameZh" @update:model-value="(v) => (form.nameZh = v)" />
          <span v-if="fieldErrors.nameZh" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.nameZh }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.groupForm.nameEnLabel') }}</span>
          <Input data-testid="g-nameEn" :model-value="form.nameEn" @update:model-value="(v) => (form.nameEn = v)" />
          <span v-if="fieldErrors.nameEn" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.nameEn }}</span>
        </label>
      </div>
      <label class="flex items-center gap-2 pb-1">
        <Switch :model-value="form.active" @update:model-value="(v) => (form.active = v)" />
        <span class="text-sm text-ink-2">{{ t('admin.groupForm.activeLabel') }}</span>
      </label>
    </div>
    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button :disabled="saving" @click="save">{{ t('common.save') }}</Button>
    </template>
  </Modal>
</template>
