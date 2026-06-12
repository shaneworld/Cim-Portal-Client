<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useLocale } from '@/lib/i18n/useLocale'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}>(), { placeholder: '', clearable: true, disabled: false })

const emit = defineEmits<{ 'update:modelValue': [string] }>()
const { t } = useLocale()

const pad = (n: number) => String(n).padStart(2, '0')

interface Parsed { y: number; mo: number; d: number; h: number; mi: number }
function parse(v: string): Parsed | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v)
  if (!m) return null
  return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5] }
}

// Trigger display: YYYY-MM-DD HH:MM
const display = computed(() => {
  const p = parse(props.modelValue)
  if (!p) return ''
  return `${p.y}-${pad(p.mo)}-${pad(p.d)} ${pad(p.h)}:${pad(p.mi)}`
})

const open = ref(false)

// Viewed month (1-based month) + selected time, initialized on open.
const viewYear = ref(0)
const viewMonth = ref(1) // 1-12
const selHour = ref(9)
const selMin = ref(0)

function initFromValue() {
  const p = parse(props.modelValue)
  const now = new Date()
  if (p) {
    viewYear.value = p.y
    viewMonth.value = p.mo
    selHour.value = p.h
    selMin.value = p.mi
  } else {
    viewYear.value = now.getFullYear()
    viewMonth.value = now.getMonth() + 1
    selHour.value = 9
    selMin.value = 0
  }
}

watch(open, (o) => { if (o) initFromValue() })

const weekdayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

const monthLabel = computed(() => `${viewYear.value}-${pad(viewMonth.value)}`)

const firstWeekday = computed(() => new Date(viewYear.value, viewMonth.value - 1, 1).getDay())
const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value, 0).getDate())
const blanks = computed(() => Array.from({ length: firstWeekday.value }))
const days = computed(() => Array.from({ length: daysInMonth.value }, (_, i) => i + 1))

const selected = computed(() => parse(props.modelValue))
const today = new Date()

function isSelected(d: number) {
  const s = selected.value
  return !!s && s.y === viewYear.value && s.mo === viewMonth.value && s.d === d
}
function isToday(d: number) {
  return today.getFullYear() === viewYear.value && today.getMonth() + 1 === viewMonth.value && today.getDate() === d
}

function prevMonth() {
  if (viewMonth.value === 1) { viewMonth.value = 12; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 12) { viewMonth.value = 1; viewYear.value++ }
  else viewMonth.value++
}

function build(y: number, mo: number, d: number, h: number, mi: number) {
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}`
}

function selectDay(d: number) {
  emit('update:modelValue', build(viewYear.value, viewMonth.value, d, selHour.value, selMin.value))
  open.value = false
}

function onTimeChange() {
  const s = selected.value
  if (s) emit('update:modelValue', build(s.y, s.mo, s.d, selHour.value, selMin.value))
}

function clear() {
  emit('update:modelValue', '')
}
function clearAndClose() {
  emit('update:modelValue', '')
  open.value = false
}
function setNow() {
  const n = new Date()
  emit('update:modelValue', build(n.getFullYear(), n.getMonth() + 1, n.getDate(), n.getHours(), n.getMinutes()))
  open.value = false
}

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 60 }, (_, i) => i)
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger
      :disabled="disabled"
      type="button"
      class="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input glass-strong px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span class="flex items-center gap-2 truncate">
        <Calendar class="size-4 shrink-0 text-muted-foreground" />
        <span v-if="display" class="truncate">{{ display }}</span>
        <span v-else class="truncate text-muted-foreground">{{ placeholder }}</span>
      </span>
      <X
        v-if="clearable && modelValue"
        data-testid="dtp-clear"
        class="size-4 shrink-0 text-muted-foreground hover:text-foreground"
        @click.stop="clear"
      />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        position="popper"
        :side-offset="6"
        align="start"
        class="anim-fade z-[60] w-[18rem] rounded-2xl border border-border bg-background p-3 shadow-2xl dark:bg-[#141b2e]"
      >
        <!-- Month header -->
        <div class="mb-2 flex items-center justify-between">
          <button type="button" class="grid size-7 place-items-center rounded-lg hover:bg-muted" @click="prevMonth">
            <ChevronLeft class="size-4" />
          </button>
          <span class="text-sm font-semibold">{{ monthLabel }}</span>
          <button type="button" class="grid size-7 place-items-center rounded-lg hover:bg-muted" @click="nextMonth">
            <ChevronRight class="size-4" />
          </button>
        </div>

        <!-- Weekday header -->
        <div class="grid grid-cols-7 text-center text-xs text-muted-foreground">
          <div v-for="k in weekdayKeys" :key="k" class="py-1">{{ t('dashboard.weekday.' + k) }}</div>
        </div>

        <!-- Day grid -->
        <div class="grid grid-cols-7 gap-0.5">
          <div v-for="(_, i) in blanks" :key="'b' + i" />
          <button
            v-for="d in days"
            :key="d"
            type="button"
            class="grid h-8 place-items-center rounded-lg text-sm hover:bg-muted"
            :class="[
              isSelected(d) ? 'bg-primary text-white hover:bg-primary' : '',
              !isSelected(d) && isToday(d) ? 'ring-1 ring-primary' : '',
            ]"
            @click="selectDay(d)"
          >
            {{ d }}
          </button>
        </div>

        <!-- Time row -->
        <div class="mt-3 flex items-center justify-center gap-2">
          <select
            v-model.number="selHour"
            class="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            @change="onTimeChange"
          >
            <option v-for="h in hours" :key="h" :value="h">{{ pad(h) }}</option>
          </select>
          <span class="text-muted-foreground">:</span>
          <select
            v-model.number="selMin"
            class="h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            @change="onTimeChange"
          >
            <option v-for="mi in minutes" :key="mi" :value="mi">{{ pad(mi) }}</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="mt-3 flex items-center justify-between">
          <button
            v-if="clearable"
            type="button"
            class="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            @click="clearAndClose"
          >
            {{ t('common.cancel') }}
          </button>
          <span v-else />
          <button
            type="button"
            class="rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:opacity-90"
            @click="setNow"
          >
            {{ t('ui.datepicker.now') }}
          </button>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
