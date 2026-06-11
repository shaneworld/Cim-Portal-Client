<script setup lang="ts">
import Modal from './Modal.vue'
import Button from './Button.vue'
import { useLocale } from '@/lib/i18n/useLocale'
const props = defineProps<{ open: boolean; title?: string; message: string; confirmLabel?: string; tone?: 'danger' | 'primary' }>()
const emit = defineEmits<{ confirm: []; cancel: []; 'update:open': [boolean] }>()
const { t } = useLocale()
</script>
<template>
  <Modal size="sm" :open="open" :title="title ?? t('ui.confirm.title')" @update:open="(v) => { if (!v) emit('cancel'); emit('update:open', v) }">
    <p class="text-sm text-ink-2">{{ message }}</p>
    <template #footer>
      <Button variant="ghost" @click="emit('cancel'); emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button :class="(props.tone ?? 'danger') === 'danger' ? 'bg-rose-600 text-white shadow hover:bg-rose-700' : ''" @click="emit('confirm')">{{ props.confirmLabel ?? t('common.delete') }}</Button>
    </template>
  </Modal>
</template>
