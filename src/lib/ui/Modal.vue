<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { useSlots } from 'vue'
const props = defineProps<{ open: boolean; title?: string }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
const slots = useSlots()
</script>
<template>
  <DialogRoot :open="props.open" @update:open="(v) => emit('update:open', v)">
    <DialogPortal :force-mount="true">
      <template v-if="props.open">
        <DialogOverlay class="anim-fade fixed inset-0 z-40 bg-black/40" />
        <DialogContent
          :force-mount="true"
          class="fixed inset-0 z-50 grid place-items-center p-4 focus:outline-none"
        >
          <div
            data-testid="modal-content"
            class="anim-fade glass-strong w-full max-w-lg rounded-2xl border border-border p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            <DialogTitle v-if="title" class="mb-4 text-lg font-bold">{{ title }}</DialogTitle>
            <slot />
            <div v-if="slots.footer" class="mt-5 flex justify-end gap-2"><slot name="footer" /></div>
          </div>
        </DialogContent>
      </template>
    </DialogPortal>
  </DialogRoot>
</template>
