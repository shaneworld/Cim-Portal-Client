<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from '@/lib/ui/Modal.vue'
import Button from '@/lib/ui/Button.vue'
import { sendFeedback } from '@/lib/api/portal'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [boolean] }>()
const toast = useToastStore()
const { t } = useLocale()

const message = ref('')
const submitting = ref(false)
const showRequired = ref(false)

// Reset the form whenever the modal is (re)opened.
watch(() => props.open, (o) => { if (o) { message.value = ''; showRequired.value = false } })

// Clear the required hint as soon as the user enters something.
watch(message, (v) => { if (v.trim()) showRequired.value = false })

async function submit() {
  if (!message.value.trim()) { showRequired.value = true; return }
  submitting.value = true
  try {
    await sendFeedback(message.value.trim())
    toast.push({ type: 'success', message: t('feedback.sent') })
    message.value = ''
    emit('update:open', false)
  } catch {
    toast.push({ type: 'error', message: t('feedback.failed') })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Modal :open="open" size="md" :title="t('feedback.title')" @update:open="(v) => emit('update:open', v)">
    <label class="block">
      <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('feedback.title') }}</span>
      <textarea
        data-testid="fb-message"
        v-model="message"
        rows="4"
        maxlength="2000"
        :aria-invalid="showRequired"
        :aria-describedby="showRequired ? 'fb-required' : undefined"
        :placeholder="t('feedback.placeholder')"
        class="w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      ></textarea>
      <span v-if="showRequired" id="fb-required" data-testid="fb-required" class="mt-1 block text-xs text-rose-500">{{ t('feedback.required') }}</span>
    </label>

    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button data-testid="fb-submit" :disabled="submitting" @click="submit">{{ t('feedback.submit') }}</Button>
    </template>
  </Modal>
</template>
