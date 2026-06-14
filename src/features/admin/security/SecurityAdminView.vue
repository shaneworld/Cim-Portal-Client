<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getSecuritySettings, updateSecuritySettings, type SecuritySettings } from '@/lib/api/admin'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import Input from '@/lib/ui/Input.vue'
import Switch from '@/lib/ui/Switch.vue'
import Button from '@/lib/ui/Button.vue'
import Select from '@/lib/ui/Select.vue'

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
  dutyApiBaseUrl: '',
  dutyApiKey: '',
  larkBaseUrl: '',
  larkAppId: '',
  larkAppSecret: '',
  larkReceiverId: '',
  larkReceiverIdType: 'email',
})

const dutyApiKeyConfigured = ref(false)
const larkAppSecretConfigured = ref(false)

const receiverIdTypeOptions = ['open_id', 'user_id', 'union_id', 'email', 'chat_id'].map((v) => ({ value: v, label: v }))

function populate(s: SecuritySettings) {
  form.ssoEnabled = s.ssoEnabled
  form.issuerUri = s.issuerUri ?? ''
  form.clientId = s.clientId ?? ''
  form.scopes = s.scopes
  form.usernameClaim = s.usernameClaim
  form.initialPassword = ''
  form.dutyApiBaseUrl = s.dutyApiBaseUrl ?? ''
  form.dutyApiKey = ''
  dutyApiKeyConfigured.value = !!s.dutyApiKeyConfigured
  form.larkBaseUrl = s.larkBaseUrl ?? ''
  form.larkAppId = s.larkAppId ?? ''
  form.larkAppSecret = ''
  form.larkReceiverId = s.larkReceiverId ?? ''
  form.larkReceiverIdType = s.larkReceiverIdType ?? 'email'
  larkAppSecretConfigured.value = !!s.larkAppSecretConfigured
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
      dutyApiBaseUrl: form.dutyApiBaseUrl || undefined,
      larkBaseUrl: form.larkBaseUrl || undefined,
      larkAppId: form.larkAppId || undefined,
      larkReceiverId: form.larkReceiverId || undefined,
      larkReceiverIdType: form.larkReceiverIdType || undefined,
      ...(form.initialPassword ? { initialPassword: form.initialPassword } : {}),
      ...(form.dutyApiKey ? { dutyApiKey: form.dutyApiKey } : {}),
      ...(form.larkAppSecret ? { larkAppSecret: form.larkAppSecret } : {}),
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

        <!-- Duty system integration -->
        <div class="border-t border-border pt-5">
          <h3 class="mb-3 text-sm font-semibold text-ink-1">{{ t('admin.security.dutyApiSection') }}</h3>
          <div class="space-y-5">
            <!-- Duty API base URL -->
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.dutyApiBaseUrl') }}</span>
              <Input v-model="form.dutyApiBaseUrl" data-testid="duty-api-base-url" placeholder="http://duty-system:port" />
            </label>

            <!-- Duty API key (write-only) -->
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.dutyApiKey') }}</span>
              <Input
                v-model="form.dutyApiKey"
                data-testid="duty-api-key"
                type="password"
                :placeholder="dutyApiKeyConfigured ? t('admin.security.dutyApiKeyConfigured') : t('admin.security.dutyApiKeyUnset')"
              />
              <span class="mt-1 block text-xs text-ink-3">{{ t('admin.security.dutyApiKeyHint') }}</span>
            </label>
          </div>
        </div>

        <!-- Lark (Feishu) integration -->
        <div class="border-t border-border pt-5">
          <h3 class="mb-3 text-sm font-semibold text-ink-1">{{ t('admin.security.lark.title') }}</h3>
          <div class="space-y-5">
            <!-- Lark base URL -->
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.lark.baseUrl') }}</span>
              <Input v-model="form.larkBaseUrl" data-testid="lark-base-url" placeholder="https://open.feishu.cn" />
            </label>

            <!-- Lark App ID -->
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.lark.appId') }}</span>
              <Input v-model="form.larkAppId" data-testid="lark-app-id" />
            </label>

            <!-- Lark App Secret (write-only) -->
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.lark.appSecret') }}</span>
              <Input
                v-model="form.larkAppSecret"
                data-testid="lark-app-secret"
                type="password"
                :placeholder="larkAppSecretConfigured ? t('admin.security.lark.appSecretConfigured') : t('admin.security.lark.appSecretUnset')"
              />
              <span class="mt-1 block text-xs text-ink-3">{{ t('admin.security.lark.appSecretHint') }}</span>
            </label>

            <!-- Lark Receiver ID -->
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.lark.receiverId') }}</span>
              <Input v-model="form.larkReceiverId" data-testid="lark-receiver-id" />
            </label>

            <!-- Lark Receiver ID Type -->
            <label class="block">
              <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.security.lark.receiverIdType') }}</span>
              <Select v-model="form.larkReceiverIdType" :options="receiverIdTypeOptions" />
            </label>
          </div>
        </div>

        <Button :disabled="saving" @click="save">{{ t('admin.security.save') }}</Button>
      </template>
    </div>
  </AdminPanel>
</template>
