<script setup lang="ts">
import Modal from './Modal.vue'
import Button from './Button.vue'
const props = defineProps<{ open: boolean; title?: string; message: string; confirmLabel?: string; tone?: 'danger' | 'primary' }>()
const emit = defineEmits<{ confirm: []; cancel: []; 'update:open': [boolean] }>()
</script>
<template>
  <Modal :open="open" :title="title ?? '确认'" @update:open="(v) => { if (!v) emit('cancel'); emit('update:open', v) }">
    <p class="text-sm text-ink-2">{{ message }}</p>
    <template #footer>
      <Button variant="ghost" @click="emit('cancel'); emit('update:open', false)">取消</Button>
      <Button :class="(props.tone ?? 'danger') === 'danger' ? 'bg-rose-600 text-white shadow hover:bg-rose-700' : ''" @click="emit('confirm')">{{ props.confirmLabel ?? '删除' }}</Button>
    </template>
  </Modal>
</template>
