<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from 'reka-ui'
import { X } from 'lucide-vue-next'
import { computed, useSlots } from 'vue'
import { useLocale } from '@/lib/i18n/useLocale'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

const props = defineProps<{ open: boolean; title?: string; size?: ModalSize }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
const slots = useSlots()
const { t } = useLocale()

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
            class="anim-fade relative rounded-2xl border border-border bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto dark:bg-[#141b2e]"
          >
            <button
              type="button"
              data-testid="modal-close"
              :aria-label="t('common.close')"
              class="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              @click="emit('update:open', false)"
            >
              <X class="h-4 w-4" />
            </button>
            <DialogTitle v-if="title" class="mb-4 pr-8 text-lg font-bold">{{ title }}</DialogTitle>
            <slot />
            <div v-if="slots.footer" class="mt-5 flex justify-end gap-2"><slot name="footer" /></div>
          </div>
        </DialogContent>
      </template>
    </DialogPortal>
  </DialogRoot>
</template>
