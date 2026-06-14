<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Input from '@/lib/ui/Input.vue'
import NumberInput from '@/lib/ui/NumberInput.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'
import Select from '@/lib/ui/Select.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import { ICON_KEYS } from '@/lib/ui/iconMap'
import { ANNOUNCEMENT_COLORS, colorClasses } from '@/lib/ui/announcementColor'
import { createEnumValue, updateEnumValue, type EnumValueInput } from '@/lib/api/admin'
import type { EnumValue, EnumCategory } from '@/lib/api/types'
import { ApiError } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'

const props = defineProps<{ open: boolean; category: EnumCategory; value: EnumValue | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const { t } = useLocale()

const showColor = computed(() => props.category === 'ANNOUNCEMENT_TYPE' || props.category === 'LINK_ENV')
const showIcon = computed(() => props.category === 'ANNOUNCEMENT_TYPE')
const colorOptions = ANNOUNCEMENT_COLORS.map((c) => ({ value: c, label: c }))

interface ExtendedInput extends EnumValueInput {
  color?: string | null
  icon?: string | null
}

const form = reactive<ExtendedInput>({ code: '', labelZh: '', labelEn: '', sortOrder: 100, active: true, color: 'blue', icon: 'bell' })
const fieldErrors = ref<Record<string, string>>({})
const saving = ref(false)

watch(() => props.open, (o) => {
  if (!o) return
  fieldErrors.value = {}
  if (props.value) {
    Object.assign(form, {
      code: props.value.code,
      labelZh: props.value.labelZh,
      labelEn: props.value.labelEn,
      sortOrder: props.value.sortOrder,
      active: props.value.active,
      color: props.value.color ?? 'blue',
      icon: props.value.icon ?? 'bell',
    })
  } else {
    Object.assign(form, { code: '', labelZh: '', labelEn: '', sortOrder: 100, active: true, color: 'blue', icon: 'bell' })
  }
}, { immediate: true })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.code.trim()) e.code = t('common.required')
  if (!form.labelZh.trim()) e.labelZh = t('common.required')
  if (!form.labelEn.trim()) e.labelEn = t('common.required')
  if (showColor.value && !form.color) e.color = t('common.mustSelect')
  if (showIcon.value && !form.icon) e.icon = t('common.mustSelect')
  fieldErrors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const input: EnumValueInput = {
      code: form.code,
      labelZh: form.labelZh,
      labelEn: form.labelEn,
      sortOrder: Number(form.sortOrder),
      active: form.active,
      ...(showColor.value ? { color: form.color } : {}),
      ...(showIcon.value ? { icon: form.icon } : {}),
    }
    if (props.value) await updateEnumValue(props.category, props.value.id, input)
    else await createEnumValue(props.category, input)
    toast.push({ type: 'success', message: props.value ? t('common.updated') : t('common.created') })
    emit('saved'); emit('update:open', false)
  } catch (err) {
    if (err instanceof ApiError && err.fieldErrors) { const e: Record<string, string> = {}; err.fieldErrors.forEach((fe) => { e[fe.field] = fe.message }); fieldErrors.value = e }
    else toast.push({ type: 'error', message: t('common.saveFailed') })
  } finally { saving.value = false }
}
</script>
<template>
  <Modal :size="showIcon ? 'lg' : 'md'" :open="open" :title="value ? t('admin.enumForm.editTitle') : t('admin.enumForm.createTitle')" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-3">
      <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.enumForm.codeLabel') }}</span>
        <Input data-testid="e-code" :model-value="form.code" :disabled="!!value" :placeholder="t('admin.enumForm.codePlaceholder')" @update:model-value="(v) => form.code = v" />
        <span v-if="fieldErrors.code" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.code }}</span></label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.enumForm.zhLabel') }}</span>
          <Input data-testid="e-zh" :model-value="form.labelZh" @update:model-value="(v) => form.labelZh = v" />
          <span v-if="fieldErrors.labelZh" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelZh }}</span></label>
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.enumForm.enLabel') }}</span>
          <Input data-testid="e-en" :model-value="form.labelEn" @update:model-value="(v) => form.labelEn = v" />
          <span v-if="fieldErrors.labelEn" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelEn }}</span></label>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.enumForm.sortLabel') }}</span>
          <NumberInput data-testid="e-sort" :model-value="form.sortOrder" @update:model-value="(v) => form.sortOrder = v" /></label>
        <label class="flex items-end gap-2 pb-1"><Switch :model-value="form.active" @update:model-value="(v) => form.active = v" /> <span class="text-sm text-ink-2">{{ t('admin.enumForm.enabledLabel') }}</span></label>
      </div>

      <!-- Color — ANNOUNCEMENT_TYPE + LINK_ENV -->
      <label v-if="showColor" class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.enumForm.colorLabel') }}</span>
        <div class="flex items-center gap-2">
          <span class="size-5 shrink-0 rounded" :class="colorClasses(form.color ?? 'slate').chip" />
          <Select data-testid="e-color" :model-value="form.color ?? 'slate'" :options="colorOptions" @update:model-value="(v) => form.color = v" />
        </div>
        <span v-if="fieldErrors.color" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.color }}</span>
      </label>

      <!-- Icon — only for ANNOUNCEMENT_TYPE -->
      <div v-if="showIcon">
        <span class="mb-1.5 block text-xs font-medium text-ink-2">{{ t('admin.enumForm.iconLabel') }}</span>
        <div class="grid gap-1.5 [grid-template-columns:repeat(auto-fill,minmax(2.75rem,1fr))]">
          <button
            v-for="ic in ICON_KEYS"
            :key="ic"
            type="button"
            :title="ic"
            :data-testid="`icon-pick-${ic}`"
            class="grid aspect-square place-items-center rounded-lg border transition"
            :class="form.icon === ic ? 'border-transparent bg-brand text-white shadow' : 'border-border text-ink-2 hover:bg-[hsl(var(--primary)/0.1)]'"
            @click="form.icon = ic"
          >
            <AppIcon :name="ic" class="size-6" />
          </button>
        </div>
        <span v-if="fieldErrors.icon" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.icon }}</span>
      </div>
    </div>
    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button :disabled="saving" @click="save">{{ t('common.save') }}</Button>
    </template>
  </Modal>
</template>
