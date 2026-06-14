<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Button from '@/lib/ui/Button.vue'
import type { HomeLink } from '@/lib/api/types'
import { requestAccess } from '@/lib/api/portal'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'

const props = defineProps<{ open: boolean; link: HomeLink | null }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
const toast = useToastStore()
const { pick, t } = useLocale()

const reason = ref('')
const submitting = ref(false)
const name = computed(() => (props.link ? pick(props.link, 'name') : ''))

// Reset the reason whenever the modal is (re)opened.
watch(() => props.open, (o) => { if (o) reason.value = '' })

async function submit() {
  if (!props.link) return
  submitting.value = true
  try {
    await requestAccess(props.link.id, reason.value || undefined)
    toast.push({ type: 'success', message: t('dashboard.accessRequest.sent') })
    emit('update:open', false)
  } catch {
    toast.push({ type: 'error', message: t('dashboard.accessRequest.failed') })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Modal :open="open" size="md" :title="t('dashboard.accessRequest.title')" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-3">
      <!-- System (read-only) -->
      <div class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('dashboard.accessRequest.systemLabel') }}</span>
        <p data-testid="ar-system" class="text-sm font-semibold">{{ name }}</p>
      </div>

      <!-- Reason (optional) -->
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('dashboard.accessRequest.reasonLabel') }}</span>
        <textarea
          data-testid="ar-reason"
          v-model="reason"
          rows="3"
          :placeholder="t('dashboard.accessRequest.reasonPlaceholder')"
          class="w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
        ></textarea>
      </label>
    </div>

    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button data-testid="ar-submit" :disabled="submitting" @click="submit">{{ t('dashboard.accessRequest.submit') }}</Button>
    </template>
  </Modal>
</template>
