<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getSecuritySettings, updateSecuritySettings, type SecuritySettings } from '@/lib/api/admin'
import { useToastStore } from '@/stores/toast'
import { useConfigStore } from '@/stores/config'
import { useLocale } from '@/lib/i18n/useLocale'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'

const { t } = useLocale()
const toast = useToastStore()
const configStore = useConfigStore()

const loading = ref(true)
const saving = ref(false)

const form = reactive({
  heroEnabled: true,
  infoPanelEnabled: true,
})

function populate(s: SecuritySettings) {
  form.heroEnabled = s.heroEnabled ?? true
  form.infoPanelEnabled = s.infoPanelEnabled ?? true
}

onMounted(async () => {
  try {
    populate(await getSecuritySettings())
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    populate(await updateSecuritySettings({ heroEnabled: form.heroEnabled, infoPanelEnabled: form.infoPanelEnabled }))
    await configStore.reload()
    toast.push({ type: 'success', message: t('common.updated') })
  } catch {
    toast.push({ type: 'error', message: t('common.saveFailed') })
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <AdminPanel :title="t('admin.display.title')">
    <div class="p-5 space-y-5 max-w-lg">
      <div v-if="loading" class="text-sm text-ink-2">{{ t('common.loading') }}…</div>
      <template v-else>
        <!-- Hero Panel toggle -->
        <div>
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.display.heroPanel') }}</span>
          <label class="flex h-10 cursor-pointer items-center gap-2.5">
            <Switch v-model="form.heroEnabled" data-testid="hero-enabled" />
            <span class="text-sm text-ink-2">{{ form.heroEnabled ? t('common.enabled') : t('common.disabled') }}</span>
          </label>
          <p class="mt-1 text-xs text-ink-3">{{ t('admin.display.heroPanelHint') }}</p>
        </div>

        <!-- Info Panel toggle -->
        <div>
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.display.infoPanel') }}</span>
          <label class="flex h-10 cursor-pointer items-center gap-2.5">
            <Switch v-model="form.infoPanelEnabled" data-testid="info-panel-enabled" />
            <span class="text-sm text-ink-2">{{ form.infoPanelEnabled ? t('common.enabled') : t('common.disabled') }}</span>
          </label>
          <p class="mt-1 text-xs text-ink-3">{{ t('admin.display.infoPanelHint') }}</p>
        </div>

        <Button :disabled="saving" @click="save">{{ t('admin.security.save') }}</Button>
      </template>
    </div>
  </AdminPanel>
</template>
