<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { getLarkSettings, updateLarkSettings, type LarkSettings } from '@/lib/api/admin'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'
import AdminPanel from '@/features/admin/AdminPanel.vue'
import Input from '@/lib/ui/Input.vue'
import Button from '@/lib/ui/Button.vue'
import Select from '@/lib/ui/Select.vue'

const { t } = useLocale()
const toast = useToastStore()

const loading = ref(true)
const saving = ref(false)

const form = reactive({
  larkBaseUrl: '',
  larkAppId: '',
  larkAppSecret: '',
  larkReceiverId: '',
  larkReceiverIdType: 'email',
})
const larkAppSecretConfigured = ref(false)
const receiverIdTypeOptions = ['open_id', 'user_id', 'union_id', 'email', 'chat_id'].map((v) => ({ value: v, label: v }))

function populate(s: LarkSettings) {
  form.larkBaseUrl = s.larkBaseUrl ?? ''
  form.larkAppId = s.larkAppId ?? ''
  form.larkAppSecret = ''
  form.larkReceiverId = s.larkReceiverId ?? ''
  form.larkReceiverIdType = s.larkReceiverIdType ?? 'email'
  larkAppSecretConfigured.value = !!s.larkAppSecretConfigured
}

onMounted(async () => {
  try {
    populate(await getLarkSettings())
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const body = {
      larkBaseUrl: form.larkBaseUrl || undefined,
      larkAppId: form.larkAppId || undefined,
      larkReceiverId: form.larkReceiverId || undefined,
      larkReceiverIdType: form.larkReceiverIdType || undefined,
      ...(form.larkAppSecret ? { larkAppSecret: form.larkAppSecret } : {}),
    }
    populate(await updateLarkSettings(body))
    toast.push({ type: 'success', message: t('common.updated') })
  } catch {
    toast.push({ type: 'error', message: t('common.saveFailed') })
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <AdminPanel :title="t('admin.feishu.title')">
    <div class="p-5 space-y-5 max-w-lg">
      <div v-if="loading" class="text-sm text-ink-2">{{ t('common.loading') }}…</div>
      <template v-else>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.feishu.baseUrl') }}</span>
          <Input v-model="form.larkBaseUrl" data-testid="lark-base-url" placeholder="https://open.feishu.cn" />
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.feishu.appId') }}</span>
          <Input v-model="form.larkAppId" data-testid="lark-app-id" />
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.feishu.appSecret') }}</span>
          <Input
            v-model="form.larkAppSecret"
            data-testid="lark-app-secret"
            type="password"
            :placeholder="larkAppSecretConfigured ? t('admin.feishu.appSecretConfigured') : t('admin.feishu.appSecretUnset')"
          />
          <span class="mt-1 block text-xs text-ink-3">{{ t('admin.feishu.appSecretHint') }}</span>
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.feishu.receiverId') }}</span>
          <Input v-model="form.larkReceiverId" data-testid="lark-receiver-id" />
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.feishu.receiverIdType') }}</span>
          <Select v-model="form.larkReceiverIdType" :options="receiverIdTypeOptions" />
        </label>

        <Button :disabled="saving" @click="save">{{ t('admin.security.save') }}</Button>
      </template>
    </div>
  </AdminPanel>
</template>
