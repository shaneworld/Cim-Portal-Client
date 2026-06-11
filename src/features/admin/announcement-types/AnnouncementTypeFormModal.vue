<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Input from '@/lib/ui/Input.vue'
import NumberInput from '@/lib/ui/NumberInput.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'
import Select from '@/lib/ui/Select.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import { ICON_KEYS } from '@/lib/ui/iconMap'
import { ANNOUNCEMENT_COLORS, colorClasses } from '@/lib/ui/announcementColor'
import { createAnnouncementType, updateAnnouncementType, type AnnouncementTypeInput, type AnnouncementType } from '@/lib/api/announcementTypes'
import { ApiError } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'

const props = defineProps<{ open: boolean; value: AnnouncementType | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const { t } = useLocale()

const form = reactive<AnnouncementTypeInput>({
  code: '',
  labelZh: '',
  labelEn: '',
  color: 'blue',
  icon: 'bell',
  sortOrder: 100,
  active: true,
})
const fieldErrors = ref<Record<string, string>>({})
const saving = ref(false)

const colorOptions = ANNOUNCEMENT_COLORS.map((c) => ({ value: c, label: c }))

watch(() => props.open, (o) => {
  if (!o) return
  fieldErrors.value = {}
  if (props.value) {
    Object.assign(form, {
      code: props.value.code,
      labelZh: props.value.labelZh,
      labelEn: props.value.labelEn,
      color: props.value.color,
      icon: props.value.icon,
      sortOrder: props.value.sortOrder,
      active: props.value.active,
    })
  } else {
    Object.assign(form, { code: '', labelZh: '', labelEn: '', color: 'blue', icon: 'bell', sortOrder: 100, active: true })
  }
}, { immediate: true })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.code.trim()) e.code = t('common.required')
  if (!form.labelZh.trim()) e.labelZh = t('common.required')
  if (!form.labelEn.trim()) e.labelEn = t('common.required')
  if (!form.color) e.color = t('common.mustSelect')
  if (!form.icon) e.icon = t('common.mustSelect')
  fieldErrors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const input: AnnouncementTypeInput = { ...form, sortOrder: Number(form.sortOrder) }
    if (props.value) await updateAnnouncementType(props.value.id, input)
    else await createAnnouncementType(input)
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
  <Modal size="lg" :open="open" :title="value ? t('admin.announcementTypeForm.editTitle') : t('admin.announcementTypeForm.createTitle')" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-3">
      <!-- Code -->
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementTypeForm.codeLabel') }}</span>
        <Input data-testid="at-code" :model-value="form.code" :disabled="!!value" :placeholder="t('admin.announcementTypeForm.codePlaceholder')" @update:model-value="(v) => form.code = v" />
        <span v-if="fieldErrors.code" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.code }}</span>
      </label>

      <!-- ZH / EN labels -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementTypeForm.zhLabel') }}</span>
          <Input data-testid="at-zh" :model-value="form.labelZh" @update:model-value="(v) => form.labelZh = v" />
          <span v-if="fieldErrors.labelZh" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelZh }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementTypeForm.enLabel') }}</span>
          <Input data-testid="at-en" :model-value="form.labelEn" @update:model-value="(v) => form.labelEn = v" />
          <span v-if="fieldErrors.labelEn" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelEn }}</span>
        </label>
      </div>

      <!-- Color select with swatch -->
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementTypeForm.colorLabel') }}</span>
        <div class="flex items-center gap-2">
          <span class="size-5 shrink-0 rounded" :class="colorClasses(form.color).chip" />
          <Select data-testid="at-color" :model-value="form.color" :options="colorOptions" @update:model-value="(v) => form.color = v" />
        </div>
        <span v-if="fieldErrors.color" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.color }}</span>
      </label>

      <!-- Sort + Active -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementTypeForm.sortLabel') }}</span>
          <NumberInput data-testid="at-sort" :model-value="form.sortOrder" @update:model-value="(v) => form.sortOrder = v" />
        </label>
        <label class="flex items-end gap-2 pb-1">
          <Switch :model-value="form.active" @update:model-value="(v) => form.active = v" data-testid="at-active" />
          <span class="text-sm text-ink-2">{{ t('admin.announcementTypeForm.activeLabel') }}</span>
        </label>
      </div>

      <!-- Icon picker -->
      <div>
        <span class="mb-1.5 block text-xs font-medium text-ink-2">{{ t('admin.announcementTypeForm.iconLabel') }}</span>
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
