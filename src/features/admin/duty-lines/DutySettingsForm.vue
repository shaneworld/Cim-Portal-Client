<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getDutySettings, updateDutySettings, type DutySettings } from '@/lib/api/admin'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Input from '@/lib/ui/Input.vue'
import Button from '@/lib/ui/Button.vue'

const { t } = useLocale()
const toast = useToastStore()

const loading = ref(true)
const saving = ref(false)

const form = reactive({
  dutyApiBaseUrl: '',
  dutyApiKey: '',
})
const dutyApiKeyConfigured = ref(false)

function populate(s: DutySettings) {
  form.dutyApiBaseUrl = s.dutyApiBaseUrl ?? ''
  form.dutyApiKey = ''
  dutyApiKeyConfigured.value = !!s.dutyApiKeyConfigured
}

onMounted(async () => {
  try {
    populate(await getDutySettings())
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const body = {
      dutyApiBaseUrl: form.dutyApiBaseUrl || undefined,
      ...(form.dutyApiKey ? { dutyApiKey: form.dutyApiKey } : {}),
    }
    populate(await updateDutySettings(body))
    toast.push({ type: 'success', message: t('common.updated') })
  } catch {
    toast.push({ type: 'error', message: t('common.saveFailed') })
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <GlassCard class="shrink-0 p-5">
    <h2 class="mb-4 text-base font-semibold text-ink-1">{{ t('admin.dutySettings.title') }}</h2>
    <div v-if="loading" class="text-sm text-ink-2">{{ t('common.loading') }}…</div>
    <div v-else class="max-w-lg space-y-4">
      <label class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.dutySettings.baseUrl') }}</span>
        <Input v-model="form.dutyApiBaseUrl" data-testid="duty-api-base-url" placeholder="http://duty-system:port" />
      </label>

      <label class="block">
        <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.dutySettings.apiKey') }}</span>
        <Input
          v-model="form.dutyApiKey"
          data-testid="duty-api-key"
          type="password"
          :placeholder="dutyApiKeyConfigured ? t('admin.dutySettings.apiKeyConfigured') : t('admin.dutySettings.apiKeyUnset')"
        />
        <span class="mt-1 block text-xs text-ink-3">{{ t('admin.dutySettings.apiKeyHint') }}</span>
      </label>

      <Button :disabled="saving" @click="save">{{ t('admin.security.save') }}</Button>
    </div>
  </GlassCard>
</template>
