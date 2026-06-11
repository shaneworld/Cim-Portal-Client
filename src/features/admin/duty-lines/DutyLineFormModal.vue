<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Input from '@/lib/ui/Input.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'
import NumberInput from '@/lib/ui/NumberInput.vue'
import { createDutyLine, updateDutyLine, type DutyLineInput, type DutyLine } from '@/lib/api/dutyLines'
import { ApiError } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'

const props = defineProps<{ open: boolean; value: DutyLine | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const { t } = useLocale()

interface FormState {
  labelZh: string
  labelEn: string
  phone: string
  sortOrder: number
  active: boolean
}

const form = reactive<FormState>({ labelZh: '', labelEn: '', phone: '', sortOrder: 0, active: true })
const fieldErrors = ref<Record<string, string>>({})
const saving = ref(false)

watch(() => props.open, (o) => {
  if (!o) return
  fieldErrors.value = {}
  if (props.value) {
    Object.assign(form, {
      labelZh: props.value.labelZh,
      labelEn: props.value.labelEn,
      phone: props.value.phone,
      sortOrder: props.value.sortOrder,
      active: props.value.active,
    })
  } else {
    Object.assign(form, { labelZh: '', labelEn: '', phone: '', sortOrder: 0, active: true })
  }
}, { immediate: true })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.labelZh.trim()) e.labelZh = t('common.required')
  if (!form.labelEn.trim()) e.labelEn = t('common.required')
  if (!form.phone.trim()) e.phone = t('common.required')
  fieldErrors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const input: DutyLineInput = {
      labelZh: form.labelZh,
      labelEn: form.labelEn,
      phone: form.phone,
      sortOrder: form.sortOrder,
      active: form.active,
    }
    if (props.value) await updateDutyLine(props.value.id, input)
    else await createDutyLine(input)
    toast.push({ type: 'success', message: props.value ? t('common.updated') : t('common.created') })
    emit('saved'); emit('update:open', false)
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
  <Modal :open="open" :title="value ? t('admin.dutyLineForm.editTitle') : t('admin.dutyLineForm.createTitle')" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-3">
      <!-- Label ZH / EN -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.dutyLineForm.labelZhLabel') }}</span>
          <Input data-testid="duty-label-zh" :model-value="form.labelZh" @update:model-value="(v) => form.labelZh = v" />
          <span v-if="fieldErrors.labelZh" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelZh }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.dutyLineForm.labelEnLabel') }}</span>
          <Input data-testid="duty-label-en" :model-value="form.labelEn" @update:model-value="(v) => form.labelEn = v" />
          <span v-if="fieldErrors.labelEn" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelEn }}</span>
        </label>
      </div>

      <!-- Phone -->
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.dutyLineForm.phoneLabel') }}</span>
        <Input data-testid="duty-phone" :model-value="form.phone" @update:model-value="(v) => form.phone = v" />
        <span v-if="fieldErrors.phone" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.phone }}</span>
      </label>

      <!-- Sort Order + Active -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.dutyLineForm.sortLabel') }}</span>
          <NumberInput data-testid="duty-sort" :model-value="form.sortOrder" @update:model-value="(v) => form.sortOrder = v" />
        </label>
        <label class="flex items-center gap-2 sm:mt-6">
          <Switch :model-value="form.active" @update:model-value="(v) => form.active = v" data-testid="duty-active" />
          <span class="text-sm text-ink-2">{{ t('admin.dutyLineForm.activeLabel') }}</span>
        </label>
      </div>
    </div>

    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button :disabled="saving" @click="save">{{ t('common.save') }}</Button>
    </template>
  </Modal>
</template>
