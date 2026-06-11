<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { computed, useSlots } from 'vue'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

const props = defineProps<{ open: boolean; title?: string; size?: ModalSize }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
const slots = useSlots()

const maxW: Record<ModalSize, string> = {
  sm: '28rem',
  md: '36rem',
  lg: '48rem',
  xl: '60rem',
}

const contentStyle = computed(() => ({
  width: `min(92vw, ${maxW[props.size ?? 'md']})`,
}))
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
            :style="contentStyle"
            class="anim-fade rounded-2xl border border-border bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto dark:bg-[#141b2e]"
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
