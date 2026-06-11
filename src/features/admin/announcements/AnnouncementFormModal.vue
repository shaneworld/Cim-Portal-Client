<script setup lang="ts">
import { reactive, ref, watch, onMounted } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Input from '@/lib/ui/Input.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'
import Select from '@/lib/ui/Select.vue'
import { createAnnouncement, updateAnnouncement, type AnnouncementInput, type Announcement } from '@/lib/api/announcements'
import { listAnnouncementTypes, type AnnouncementType } from '@/lib/api/announcementTypes'
import { ApiError } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'

const props = defineProps<{ open: boolean; value: Announcement | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const { t, pick } = useLocale()

interface FormState {
  titleZh: string; titleEn: string
  bodyZh: string; bodyEn: string
  typeCode: string
  pinned: boolean; active: boolean
  startsAt: string; endsAt: string
}

const form = reactive<FormState>({ titleZh: '', titleEn: '', bodyZh: '', bodyEn: '', typeCode: '', pinned: false, active: true, startsAt: '', endsAt: '' })
const fieldErrors = ref<Record<string, string>>({})
const saving = ref(false)
const types = ref<AnnouncementType[]>([])

const typeOptions = () => types.value.filter((t) => t.active).map((t) => ({ value: t.code, label: pick(t, 'label') }))

function toLocalDatetime(iso?: string): string {
  if (!iso) return ''
  // Convert ISO to local datetime-local input format YYYY-MM-DDTHH:MM
  return iso.slice(0, 16)
}

function toIso(local: string): string | undefined {
  if (!local) return undefined
  return new Date(local).toISOString()
}

watch(() => props.open, (o) => {
  if (!o) return
  fieldErrors.value = {}
  if (props.value) {
    Object.assign(form, {
      titleZh: props.value.titleZh,
      titleEn: props.value.titleEn,
      bodyZh: props.value.bodyZh,
      bodyEn: props.value.bodyEn,
      typeCode: props.value.typeCode,
      pinned: props.value.pinned,
      active: props.value.active,
      startsAt: toLocalDatetime(props.value.startsAt),
      endsAt: toLocalDatetime(props.value.endsAt),
    })
  } else {
    Object.assign(form, { titleZh: '', titleEn: '', bodyZh: '', bodyEn: '', typeCode: types.value[0]?.code ?? '', pinned: false, active: true, startsAt: '', endsAt: '' })
  }
}, { immediate: true })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.titleZh.trim()) e.titleZh = t('common.required')
  if (!form.titleEn.trim()) e.titleEn = t('common.required')
  if (!form.typeCode) e.typeCode = t('common.mustSelect')
  fieldErrors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const input: AnnouncementInput = {
      titleZh: form.titleZh,
      titleEn: form.titleEn,
      bodyZh: form.bodyZh,
      bodyEn: form.bodyEn,
      typeCode: form.typeCode,
      pinned: form.pinned,
      active: form.active,
      startsAt: toIso(form.startsAt),
      endsAt: toIso(form.endsAt),
    }
    if (props.value) await updateAnnouncement(props.value.id, input)
    else await createAnnouncement(input)
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

onMounted(async () => {
  try { types.value = await listAnnouncementTypes() } catch { /* ignore */ }
})
</script>

<template>
  <Modal size="lg" :open="open" :title="value ? t('admin.announcementForm.editTitle') : t('admin.announcementForm.createTitle')" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-3">
      <!-- Title ZH / EN -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementForm.titleZhLabel') }}</span>
          <Input data-testid="ann-title-zh" :model-value="form.titleZh" @update:model-value="(v) => form.titleZh = v" />
          <span v-if="fieldErrors.titleZh" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.titleZh }}</span>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementForm.titleEnLabel') }}</span>
          <Input data-testid="ann-title-en" :model-value="form.titleEn" @update:model-value="(v) => form.titleEn = v" />
          <span v-if="fieldErrors.titleEn" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.titleEn }}</span>
        </label>
      </div>

      <!-- Body ZH / EN -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementForm.bodyZhLabel') }}</span>
          <textarea
            data-testid="ann-body-zh"
            class="h-24 w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :value="form.bodyZh"
            @input="(e) => form.bodyZh = (e.target as HTMLTextAreaElement).value"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementForm.bodyEnLabel') }}</span>
          <textarea
            data-testid="ann-body-en"
            class="h-24 w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :value="form.bodyEn"
            @input="(e) => form.bodyEn = (e.target as HTMLTextAreaElement).value"
          />
        </label>
      </div>

      <!-- Type Select -->
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementForm.typeLabel') }}</span>
        <Select data-testid="ann-type" :model-value="form.typeCode" :options="typeOptions()" @update:model-value="(v) => form.typeCode = v" />
        <span v-if="fieldErrors.typeCode" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.typeCode }}</span>
      </label>

      <!-- Pinned + Active -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="flex items-center gap-2">
          <Switch :model-value="form.pinned" @update:model-value="(v) => form.pinned = v" data-testid="ann-pinned" />
          <span class="text-sm text-ink-2">{{ t('admin.announcementForm.pinnedLabel') }}</span>
        </label>
        <label class="flex items-center gap-2">
          <Switch :model-value="form.active" @update:model-value="(v) => form.active = v" data-testid="ann-active" />
          <span class="text-sm text-ink-2">{{ t('admin.announcementForm.activeLabel') }}</span>
        </label>
      </div>

      <!-- Date window -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementForm.startsAtLabel') }}</span>
          <input
            type="datetime-local"
            data-testid="ann-starts-at"
            class="h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :value="form.startsAt"
            @change="(e) => form.startsAt = (e.target as HTMLInputElement).value"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.announcementForm.endsAtLabel') }}</span>
          <input
            type="datetime-local"
            data-testid="ann-ends-at"
            class="h-10 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :value="form.endsAt"
            @change="(e) => form.endsAt = (e.target as HTMLInputElement).value"
          />
        </label>
      </div>
    </div>

    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button :disabled="saving" @click="save">{{ t('common.save') }}</Button>
    </template>
  </Modal>
</template>
