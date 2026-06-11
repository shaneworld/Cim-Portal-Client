<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getSecuritySettings, updateSecuritySettings, type SecuritySettings } from '@/lib/api/admin'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import Input from '@/lib/ui/Input.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'

const { t } = useLocale()
const toast = useToastStore()

const loading = ref(true)
const saving = ref(false)

const form = reactive({
  ssoEnabled: false,
  issuerUri: '',
  clientId: '',
  scopes: 'openid profile',
  usernameClaim: 'preferred_username',
  initialPassword: '',
})

function populate(s: SecuritySettings) {
  form.ssoEnabled = s.ssoEnabled
  form.issuerUri = s.issuerUri ?? ''
  form.clientId = s.clientId ?? ''
  form.scopes = s.scopes
  form.usernameClaim = s.usernameClaim
  form.initialPassword = ''
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
    const body = {
      ssoEnabled: form.ssoEnabled,
      issuerUri: form.issuerUri || undefined,
      clientId: form.clientId || undefined,
      scopes: form.scopes,
      usernameClaim: form.usernameClaim,
      ...(form.initialPassword ? { initialPassword: form.initialPassword } : {}),
    }
    populate(await updateSecuritySettings(body))
    toast.push({ type: 'success', message: t('common.updated') })
  } catch {
    toast.push({ type: 'error', message: t('common.saveFailed') })
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <AdminPanel :title="t('admin.security.title')">
    <div class="p-5 space-y-5 max-w-lg">
      <div v-if="loading" class="text-sm text-ink-2">{{ t('common.loading') }}…</div>
      <template v-else>
        <!-- SSO Enabled toggle -->
        <div>
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.ssoEnabled') }}</span>
          <label class="flex h-10 cursor-pointer items-center gap-2.5">
            <Switch v-model="form.ssoEnabled" data-testid="sso-enabled" />
            <span class="text-sm text-ink-2">{{ form.ssoEnabled ? t('common.enabled') : t('common.disabled') }}</span>
          </label>
        </div>

        <!-- Issuer URI -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.issuerUri') }}</span>
          <Input v-model="form.issuerUri" data-testid="issuer-uri" placeholder="https://keycloak.example.com/realms/myrealm" />
        </label>

        <!-- Client ID -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.clientId') }}</span>
          <Input v-model="form.clientId" data-testid="client-id" placeholder="cim-portal" />
        </label>

        <!-- Scopes -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.scopes') }}</span>
          <Input v-model="form.scopes" data-testid="scopes" placeholder="openid profile" />
        </label>

        <!-- Username Claim -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.usernameClaim') }}</span>
          <Input v-model="form.usernameClaim" data-testid="username-claim" placeholder="preferred_username" />
        </label>

        <!-- Initial Password (write-only) -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.initialPassword') }}</span>
          <Input v-model="form.initialPassword" data-testid="initial-password" type="password" :placeholder="t('admin.security.initialPasswordHint')" />
        </label>

        <Button :disabled="saving" @click="save">{{ t('admin.security.save') }}</Button>
      </template>
    </div>
  </AdminPanel>
</template>
