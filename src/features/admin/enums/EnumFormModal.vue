<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Input from '@/lib/ui/Input.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'
import { createEnumValue, updateEnumValue, type EnumValueInput } from '@/lib/api/admin'
import type { EnumValue, EnumCategory } from '@/lib/api/types'
import { ApiError } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'

const props = defineProps<{ open: boolean; category: EnumCategory; value: EnumValue | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const form = reactive<EnumValueInput>({ code: '', labelZh: '', labelEn: '', sortOrder: 100, active: true })
const fieldErrors = ref<Record<string, string>>({})
const saving = ref(false)

watch(() => props.open, (o) => {
  if (!o) return
  fieldErrors.value = {}
  if (props.value) Object.assign(form, { code: props.value.code, labelZh: props.value.labelZh, labelEn: props.value.labelEn, sortOrder: props.value.sortOrder, active: props.value.active })
  else Object.assign(form, { code: '', labelZh: '', labelEn: '', sortOrder: 100, active: true })
}, { immediate: true })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.code.trim()) e.code = '必填'
  if (!form.labelZh.trim()) e.labelZh = '必填'
  if (!form.labelEn.trim()) e.labelEn = '必填'
  fieldErrors.value = e
  return Object.keys(e).length === 0
}
async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const input: EnumValueInput = { ...form, sortOrder: Number(form.sortOrder) }
    if (props.value) await updateEnumValue(props.category, props.value.id, input)
    else await createEnumValue(props.category, input)
    toast.push({ type: 'success', message: props.value ? '已更新' : '已创建' })
    emit('saved'); emit('update:open', false)
  } catch (err) {
    if (err instanceof ApiError && err.fieldErrors) { const e: Record<string, string> = {}; err.fieldErrors.forEach((fe) => { e[fe.field] = fe.message }); fieldErrors.value = e }
    else toast.push({ type: 'error', message: '保存失败' })
  } finally { saving.value = false }
}
</script>
<template>
  <Modal :open="open" :title="value ? '编辑枚举值' : '新建枚举值'" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-3">
      <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">代码 Code</span>
        <Input data-testid="e-code" :model-value="form.code" :disabled="!!value" placeholder="如 MES" @update:model-value="(v) => form.code = v" />
        <span v-if="fieldErrors.code" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.code }}</span></label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">中文名</span>
          <Input data-testid="e-zh" :model-value="form.labelZh" @update:model-value="(v) => form.labelZh = v" />
          <span v-if="fieldErrors.labelZh" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelZh }}</span></label>
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">英文名</span>
          <Input data-testid="e-en" :model-value="form.labelEn" @update:model-value="(v) => form.labelEn = v" />
          <span v-if="fieldErrors.labelEn" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.labelEn }}</span></label>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">排序 Sort</span>
          <Input data-testid="e-sort" type="number" :model-value="String(form.sortOrder)" @update:model-value="(v) => form.sortOrder = Number(v)" /></label>
        <label class="flex items-end gap-2 pb-1"><Switch :model-value="form.active" @update:model-value="(v) => form.active = v" /> <span class="text-sm text-ink-2">启用</span></label>
      </div>
    </div>
    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">取消</Button>
      <Button :disabled="saving" @click="save">保存</Button>
    </template>
  </Modal>
</template>
