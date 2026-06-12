<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Upload } from 'lucide-vue-next'
import Modal from '@/lib/ui/Modal.vue'
import Input from '@/lib/ui/Input.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'
import NumberInput from '@/lib/ui/NumberInput.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import { ICON_KEYS } from '@/lib/ui/iconMap'
import { uploadIcon } from '@/lib/api/admin'
import { createQuickLink, updateQuickLink, getAdminQuickLink, type QuickLinkInput, type QuickLink } from '@/lib/api/quickLinks'
import { ApiError } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'

const props = defineProps<{ open: boolean; value: QuickLink | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const { t } = useLocale()

interface FormState {
  labelZh: string
  labelEn: string
  url: string
  icon: string
  sortOrder: number
  active: boolean
}

const form = reactive<FormState>({ labelZh: '', labelEn: '', url: '', icon: 'external-link', sortOrder: 0, active: true })
const fieldErrors = ref<Record<string, string>>({})
const saving = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const isUpload = computed(() => !!form.icon?.startsWith('upload:'))

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const res = await uploadIcon(file)
    form.icon = res.ref
  } catch {
    toast.push({ type: 'error', message: t('admin.linkForm.uploadIconFailed') })
  } finally {
    uploading.value = false
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

async function populate() {
  fieldErrors.value = {}
  if (props.value) {
    Object.assign(form, {
      labelZh: props.value.labelZh,
      labelEn: props.value.labelEn,
      url: props.value.url,
      icon: props.value.icon || 'external-link',
      sortOrder: props.value.sortOrder,
      active: props.value.active,
    })
    // Fetch the detail to ensure latest values.
    try {
      const full = await getAdminQuickLink(props.value.id)
      Object.assign(form, {
        labelZh: full.labelZh,
        labelEn: full.labelEn,
        url: full.url,
        icon: full.icon || 'external-link',
        sortOrder: full.sortOrder,
        active: full.active,
      })
    } catch { /* keep seeded values */ }
  } else {
    Object.assign(form, { labelZh: '', labelEn: '', url: '', icon: 'external-link', sortOrder: 0, active: true })
  }
}

watch(() => props.open, (o) => { if (o) populate() }, { immediate: true })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.labelZh.trim()) e.labelZh = t('common.required')
  if (!form.labelEn.trim()) e.labelEn = t('common.required')
  if (!form.url.trim()) e.url = t('common.required')
  fieldErrors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const input: QuickLinkInput = {
      labelZh: form.labelZh,
      labelEn: form.labelEn,
      url: form.url,
      icon: form.icon,
      sortOrder: Number(form.sortOrder),
      active: form.active,
    }
    if (props.value) await updateQuickLink(props.value.id, input)
    else await createQuickLink(input)
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
  <Modal :open="open" :title="value ? t('admin.quickLinkForm.editTitle') : t('admin.quickLinkForm.createTitle')" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-3">
      <!-- Label ZH / EN -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.quickLinkForm.labelZhLabel') }}</span>
          <Input data-testid="ql-label-zh" :model-value="form.labelZh" @update:model-value="(v) => form.labelZh = v" />
          <span v-if="fieldErrors.labelZh" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelZh }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.quickLinkForm.labelEnLabel') }}</span>
          <Input data-testid="ql-label-en" :model-value="form.labelEn" @update:model-value="(v) => form.labelEn = v" />
          <span v-if="fieldErrors.labelEn" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelEn }}</span>
        </label>
      </div>

      <!-- URL -->
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.quickLinkForm.urlLabel') }}</span>
        <Input data-testid="ql-url" type="url" placeholder="https://..." :model-value="form.url" @update:model-value="(v) => form.url = v" />
        <span v-if="fieldErrors.url" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.url }}</span>
      </label>

      <!-- Icon picker (built-in grid + custom upload) -->
      <div>
        <span class="mb-1.5 block text-xs font-medium text-ink-2">{{ t('admin.quickLinkForm.iconLabel') }}</span>
        <input ref="fileInputRef" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="hidden" @change="onFileChange" />
        <!-- live preview + upload button -->
        <div class="mb-3 flex items-center gap-4">
          <div :class="['grid size-16 shrink-0 place-items-center rounded-2xl', isUpload ? 'border border-border bg-white p-2' : 'bg-brand text-white']">
            <AppIcon :name="form.icon" :class="isUpload ? 'h-full w-full' : 'size-9'" />
          </div>
          <div class="min-w-0">
            <button type="button" :disabled="uploading"
              class="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.06)] px-3.5 py-2 text-sm font-semibold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--primary)/0.12)] disabled:opacity-60"
              @click="fileInputRef?.click()">
              <Upload class="size-4" /> {{ uploading ? t('common.loading') : (isUpload ? t('admin.linkForm.replaceIcon') : t('admin.linkForm.uploadIcon')) }}
            </button>
            <p class="mt-1.5 text-xs text-ink-3">{{ t('admin.linkForm.iconHint') }}</p>
          </div>
        </div>
        <!-- built-in icon grid -->
        <div class="grid gap-1.5 [grid-template-columns:repeat(auto-fill,minmax(2.75rem,1fr))]">
          <button v-for="ic in ICON_KEYS" :key="ic" type="button" :title="ic"
            class="grid aspect-square place-items-center rounded-lg border transition"
            :class="form.icon === ic ? 'border-transparent bg-brand text-white shadow' : 'border-border text-ink-2 hover:bg-[hsl(var(--primary)/0.1)]'"
            @click="form.icon = ic"><AppIcon :name="ic" class="size-6" /></button>
        </div>
      </div>

      <!-- Sort Order + Active -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.quickLinkForm.sortLabel') }}</span>
          <NumberInput data-testid="ql-sort" :model-value="form.sortOrder" @update:model-value="(v) => form.sortOrder = v" />
        </label>
        <label class="flex items-center gap-2 sm:mt-6">
          <Switch :model-value="form.active" @update:model-value="(v) => form.active = v" data-testid="ql-active" />
          <span class="text-sm text-ink-2">{{ t('admin.quickLinkForm.activeLabel') }}</span>
        </label>
      </div>
    </div>

    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button :disabled="saving" @click="save">{{ t('common.save') }}</Button>
    </template>
  </Modal>
</template>
