<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { Trash2, Plus } from 'lucide-vue-next'
import Modal from '@/lib/ui/Modal.vue'
import Input from '@/lib/ui/Input.vue'
import NumberInput from '@/lib/ui/NumberInput.vue'
import Button from '@/lib/ui/Button.vue'
import Select from '@/lib/ui/Select.vue'
import Switch from '@/lib/ui/Switch.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import { listEnum } from '@/lib/api/enums'
import { createLink, updateLink, replaceGrants, getLink, type AdminLink, type LinkInput, type GrantInput, type GrantType } from '@/lib/api/admin'
import { ApiError } from '@/lib/api/client'
import { useToastStore } from '@/stores/toast'
import { useLocale } from '@/lib/i18n/useLocale'
import { GRANT_TYPES } from '@/constants'

const props = defineProps<{ open: boolean; link: AdminLink | null }>()
const emit = defineEmits<{ 'update:open': [boolean]; saved: [] }>()
const toast = useToastStore()
const { pick, t } = useLocale()

const ICON_KEYS = ['factory','line-chart','gauge','wrench','boxes','file-text','trending-up','activity','package','book','archive']
type Opt = { value: string; label: string }
const catOpts = ref<Opt[]>([]); const statusOpts = ref<Opt[]>([]); const deptOpts = ref<Opt[]>([]); const roleOpts = ref<Opt[]>([])
const grantTypeOpts: Opt[] = [{ value: GRANT_TYPES.DEPARTMENT, label: t('admin.enums.categories.department') }, { value: GRANT_TYPES.ROLE, label: t('admin.enums.categories.role') }]

const form = reactive<LinkInput>({ code: '', nameZh: '', nameEn: '', url: '', icon: 'factory', categoryCode: '', statusCode: '', sortOrder: 100, openInNewTab: true })
const grants = ref<GrantInput[]>([])
const fieldErrors = ref<Record<string, string>>({})
const saving = ref(false)

function codesFor(t: GrantType): Opt[] { return t === GRANT_TYPES.DEPARTMENT ? deptOpts.value : roleOpts.value }

async function loadEnums() {
  const toOpt = (e: { code: string; labelZh: string; labelEn: string }) => ({ value: e.code, label: pick(e as { labelZh: string; labelEn: string } & Record<string, string>, 'label') })
  const [cat, st, dept, role] = await Promise.all([listEnum('LINK_CATEGORY'), listEnum('LINK_STATUS'), listEnum('DEPARTMENT'), listEnum('ROLE')])
  catOpts.value = cat.map(toOpt); statusOpts.value = st.map(toOpt); deptOpts.value = dept.map(toOpt); roleOpts.value = role.map(toOpt)
  if (!props.link) {
    if (!form.categoryCode && catOpts.value[0]) form.categoryCode = catOpts.value[0].value
    if (!form.statusCode && statusOpts.value[0]) form.statusCode = statusOpts.value[0].value
  }
}
async function populate() {
  fieldErrors.value = {}
  if (props.link) {
    Object.assign(form, { code: props.link.code, nameZh: props.link.nameZh, nameEn: props.link.nameEn, url: props.link.url, icon: props.link.icon, categoryCode: props.link.categoryCode, statusCode: props.link.statusCode, sortOrder: props.link.sortOrder, openInNewTab: props.link.openInNewTab })
    grants.value = props.link.grants.map((g) => ({ grantType: g.grantType, grantCode: g.grantCode }))
    // The list endpoint returns grants:[]; fetch the detail to load the real grants
    // (otherwise saving would replace them with an empty set and wipe access).
    try { const full = await getLink(props.link.id); grants.value = full.grants.map((g) => ({ grantType: g.grantType, grantCode: g.grantCode })) } catch { /* keep seeded grants */ }
  } else {
    Object.assign(form, { code: '', nameZh: '', nameEn: '', url: '', icon: 'factory', categoryCode: '', statusCode: '', sortOrder: 100, openInNewTab: true })
    grants.value = []
  }
}
watch(() => props.open, (o) => { if (o) { populate(); loadEnums() } }, { immediate: true })

function addGrant() { grants.value.push({ grantType: 'DEPARTMENT', grantCode: '' }) }
function removeGrant(i: number) { grants.value.splice(i, 1) }
function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.code.trim()) e.code = t('common.required')
  if (!form.nameZh.trim()) e.nameZh = t('common.required')
  if (!form.nameEn.trim()) e.nameEn = t('common.required')
  if (!form.url.trim()) e.url = t('common.required')
  if (!form.categoryCode) e.categoryCode = t('common.mustSelect')
  if (!form.statusCode) e.statusCode = t('common.mustSelect')
  if (!form.icon) e.icon = t('common.mustSelect')
  fieldErrors.value = e
  return Object.keys(e).length === 0
}
async function save() {
  if (!validate()) return
  saving.value = true
  try {
    const input: LinkInput = { ...form, sortOrder: Number(form.sortOrder) }
    const saved = props.link ? await updateLink(props.link.id, input) : await createLink(input)
    await replaceGrants(saved.id, grants.value.filter((g) => g.grantCode))
    toast.push({ type: 'success', message: props.link ? t('common.updated') : t('common.created') })
    emit('saved'); emit('update:open', false)
  } catch (err) {
    if (err instanceof ApiError && err.fieldErrors) { const e: Record<string, string> = {}; err.fieldErrors.forEach((fe) => { e[fe.field] = fe.message }); fieldErrors.value = e }
    else toast.push({ type: 'error', message: t('common.saveFailed') })
  } finally { saving.value = false }
}
</script>
<template>
  <Modal :open="open" :title="link ? t('admin.linkForm.editTitle') : t('admin.linkForm.createTitle')" @update:open="(v) => emit('update:open', v)">
    <div class="space-y-3">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.linkForm.codeLabel') }}</span>
          <Input data-testid="f-code" :model-value="form.code" :disabled="!!link" placeholder="mes-wip" @update:model-value="(v) => form.code = v" />
          <span v-if="fieldErrors.code" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.code }}</span></label>
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.linkForm.sortLabel') }}</span>
          <NumberInput data-testid="f-sortOrder" :model-value="form.sortOrder" @update:model-value="(v) => form.sortOrder = v" /></label>
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.linkForm.nameZhLabel') }}</span>
          <Input data-testid="f-nameZh" :model-value="form.nameZh" @update:model-value="(v) => form.nameZh = v" />
          <span v-if="fieldErrors.nameZh" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.nameZh }}</span></label>
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.linkForm.nameEnLabel') }}</span>
          <Input data-testid="f-nameEn" :model-value="form.nameEn" @update:model-value="(v) => form.nameEn = v" />
          <span v-if="fieldErrors.nameEn" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.nameEn }}</span></label>
      </div>
      <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.linkForm.urlLabel') }}</span>
        <Input data-testid="f-url" :model-value="form.url" placeholder="https://..." @update:model-value="(v) => form.url = v" />
        <span v-if="fieldErrors.url" class="mt-1 block text-xs text-rose-500">{{ fieldErrors.url }}</span></label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.linkForm.categoryLabel') }}</span>
          <Select :model-value="form.categoryCode" :options="catOpts" :placeholder="t('admin.linkForm.categoryLabel')" @update:model-value="(v) => form.categoryCode = v" /></label>
        <label class="block"><span class="mb-1 block text-xs font-medium text-ink-2">{{ t('admin.linkForm.statusLabel') }}</span>
          <Select :model-value="form.statusCode" :options="statusOpts" :placeholder="t('admin.linkForm.statusLabel')" @update:model-value="(v) => form.statusCode = v" /></label>
      </div>
      <div><span class="mb-1.5 block text-xs font-medium text-ink-2">{{ t('admin.linkForm.iconLabel') }}</span>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="ic in ICON_KEYS" :key="ic" type="button" :title="ic"
            class="grid size-9 place-items-center rounded-lg border transition"
            :class="form.icon === ic ? 'border-transparent bg-brand text-white shadow' : 'border-border text-ink-2 hover:bg-[hsl(var(--primary)/0.1)]'"
            @click="form.icon = ic"><AppIcon :name="ic" class="size-4" /></button>
        </div>
      </div>
      <label class="flex items-center gap-2"><Switch :model-value="form.openInNewTab" @update:model-value="(v) => form.openInNewTab = v" /> <span class="text-sm text-ink-2">{{ t('admin.linkForm.openInNewTab') }}</span></label>
      <div class="border-t border-border/60 pt-3">
        <div class="mb-2 flex items-center justify-between"><b class="text-sm">{{ t('admin.linkForm.grants') }}</b><button type="button" class="flex items-center gap-1 text-sm font-medium text-[hsl(var(--primary))] transition hover:opacity-80" @click="addGrant"><Plus class="size-4" /> {{ t('admin.linkForm.addGrant') }}</button></div>
        <p v-if="!grants.length" class="text-xs text-ink-3">{{ t('admin.linkForm.grantsHint') }}</p>
        <div v-for="(g, i) in grants" :key="i" class="mb-2 flex items-center gap-2">
          <Select :model-value="g.grantType" :options="grantTypeOpts" class="w-28 shrink-0" @update:model-value="(v) => { g.grantType = v as GrantType; g.grantCode = '' }" />
          <Select :model-value="g.grantCode" :options="codesFor(g.grantType)" :placeholder="t('admin.linkForm.grantSelect')" class="flex-1" @update:model-value="(v) => g.grantCode = v" />
          <button type="button" class="grid size-10 shrink-0 place-items-center rounded-xl text-rose-500 transition hover:bg-rose-500/10" @click="removeGrant(i)"><Trash2 class="size-4" /></button>
        </div>
      </div>
    </div>
    <template #footer>
      <Button variant="ghost" @click="emit('update:open', false)">{{ t('common.cancel') }}</Button>
      <Button :disabled="saving" @click="save">{{ t('common.save') }}</Button>
    </template>
  </Modal>
</template>
