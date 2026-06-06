# 玻璃拟态前端重建 — P1b 仪表盘(数据可视化 Hero + 领域高亮 + 系统网格)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用完整玻璃仪表盘覆盖 P1a 落地占位:实时数据可视化 Hero(OEE 仪表 + KPI + 区域图)、带图标的领域高亮、系统卡片网格、客户端搜索、安全合规条。

**Architecture:** 在 P1a 基础上新增手写 SVG 可视化原语(Gauge/Sparkline/AreaChart/KpiStat)、`useClock` 组合式、可插拔 `MetricsProvider`(本期 sample 数据,明确标注示例)、`AppIcon` 解析,以及仪表盘组件(AppHeader/HeroPanel/DomainHighlights/SystemGrid/TrustStrip/GlobalSearch),最后由 `HomeView` 组装 + 搜索过滤。

**Tech Stack:** Vue 3.5 + TS + Tailwind v3 + Pinia + vue-i18n + lucide-vue-next + Vitest/MSW。手写 SVG 图表,无图表依赖。

**契约:** 设计见 spec §5.2/§6/§7。已存在(P1a):`@/lib/ui/{GlassCard,Button,Input,Badge,StatusDot,Skeleton}.vue`、`@/lib/i18n/useLocale`(`pick`/`useLocale`)、`@/stores/{auth(currentUser/isAdmin/logout),labels(setLocale),toast}`、`@/lib/theme/useTheme`(`mode`/`setMode`)、`@/lib/api/portal`(`getHome`)、`@/lib/api/types`(`HomeCategory`/`HomeLink`)。玻璃令牌:`.glass`/`.glass-strong`/`.bg-brand`/`.text-ink-2`/`.text-ink-3`、`--go/--caution/--stop/--ink-3/--primary`、`@keyframes shimmer/pulse-dot/fade-up`。

**硬约束:既有 19 测试保持全绿。** **仓库** `/home/shane/Code/cim-portal/cim-portal-frontend`(分支:在 `master` 上新建 `p1b`)。提交追加:`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。**门禁** `npm run typecheck && npm test`(+ `npm run build` 触及集成时)。

---

## 文件结构(P1b)

```
src/lib/composables/useClock.ts
src/lib/metrics/{MetricsProvider.ts, sampleMetrics.ts, index.ts}
src/lib/viz/{Gauge,Sparkline,AreaChart,KpiStat}.vue
src/lib/ui/{AppIcon.vue, iconMap.ts}
src/features/dashboard/{AppHeader,HeroPanel,DomainHighlights,SystemCard,SystemGrid,TrustStrip,GlobalSearch}.vue
src/features/dashboard/HomeView.vue   # 覆盖 P1a 占位
```

---

## Task 1: useClock + MetricsProvider(sample)

**Files:** Create `src/lib/composables/useClock.ts`, `src/lib/metrics/{MetricsProvider.ts,sampleMetrics.ts,index.ts}`, `src/lib/metrics/sampleMetrics.spec.ts`, `src/lib/composables/useClock.spec.ts`

- [ ] **Step 1: failing tests**

`src/lib/composables/useClock.spec.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { useClock } from './useClock'
const Host = defineComponent({ setup() { const { time, weekday } = useClock(); return () => h('div', `${time.value}|${weekday.value}`) } })
afterEach(() => vi.useRealTimers())
describe('useClock', () => {
  it('renders HH:MM:SS, ticks, cleans up', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 0, 2, 9, 8, 7))
    const w = mount(Host)
    expect(w.text()).toMatch(/^09:08:07\|周五/)
    vi.advanceTimersByTime(1000)
    const spy = vi.spyOn(globalThis, 'clearInterval'); w.unmount(); expect(spy).toHaveBeenCalled()
  })
})
```
`src/lib/metrics/sampleMetrics.spec.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { createMetricsProvider } from './index'
describe('metrics', () => {
  it('sample provider returns labeled sample KPIs', async () => {
    const m = await createMetricsProvider().getMetrics()
    expect(m.sample).toBe(true)
    expect(m.oeePct).toBeGreaterThan(0)
    expect(m.shiftOutput.length).toBeGreaterThan(3)
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- useClock` / `sampleMetrics` → FAIL.

- [ ] **Step 3: implement**

`src/lib/composables/useClock.ts`:
```ts
import { ref, onMounted, onUnmounted } from 'vue'
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export function useClock() {
  const time = ref(''); const weekday = ref('')
  let timer: ReturnType<typeof setInterval> | undefined
  const pad = (n: number) => String(n).padStart(2, '0')
  function tick() { const d = new Date(); time.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; weekday.value = WEEKDAYS[d.getDay()] }
  tick()
  onMounted(() => { tick(); timer = setInterval(tick, 1000) })
  onUnmounted(() => { if (timer) clearInterval(timer) })
  return { time, weekday }
}
```
`src/lib/metrics/MetricsProvider.ts`:
```ts
export interface PortalMetrics {
  oeePct: number; wip: number; yieldPct: number; throughput: string
  wipDeltaPct: number; yieldDeltaPct: number; throughputDeltaPct: number
  shiftOutput: number[]
  sample: boolean
}
export interface MetricsProvider { getMetrics(): Promise<PortalMetrics> }
```
`src/lib/metrics/sampleMetrics.ts`:
```ts
import type { MetricsProvider } from './MetricsProvider'
/** SAMPLE data — backend has no metrics feed yet. Clearly flagged via `sample:true`. */
export function createSampleMetrics(): MetricsProvider {
  return { async getMetrics() {
    return { oeePct: 87.4, wip: 1240, yieldPct: 98.2, throughput: '24.6k',
      wipDeltaPct: 3.2, yieldDeltaPct: 0.4, throughputDeltaPct: -1.1,
      shiftOutput: [40, 54, 46, 78, 70, 100, 92, 116, 110], sample: true }
  } }
}
```
`src/lib/metrics/index.ts`:
```ts
import { createSampleMetrics } from './sampleMetrics'
import type { MetricsProvider } from './MetricsProvider'
export type { PortalMetrics, MetricsProvider } from './MetricsProvider'
/** Sample-only this phase; swap to a real API-backed provider when a metrics endpoint exists. */
export function createMetricsProvider(): MetricsProvider { return createSampleMetrics() }
```

- [ ] **Step 4: run + typecheck** — `npm test -- useClock && npm test -- sampleMetrics && npm run typecheck` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/lib/composables src/lib/metrics
git commit -m "feat(dashboard): useClock + 可插拔 MetricsProvider(sample 数据)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: SVG 可视化原语(Gauge/Sparkline/AreaChart/KpiStat)

**Files:** Create `src/lib/viz/{Gauge,Sparkline,AreaChart,KpiStat}.vue`, `src/lib/viz/viz.spec.ts`

- [ ] **Step 1: failing test `src/lib/viz/viz.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Gauge from './Gauge.vue'
import Sparkline from './Sparkline.vue'
import AreaChart from './AreaChart.vue'
import KpiStat from './KpiStat.vue'

describe('viz primitives', () => {
  it('Gauge renders an svg arc + the value text', () => {
    const w = mount(Gauge, { props: { value: 87.4, label: 'OEE %' } })
    expect(w.find('svg').exists()).toBe(true); expect(w.text()).toContain('87.4'); expect(w.text()).toContain('OEE')
  })
  it('Sparkline renders a polyline from points', () => {
    const w = mount(Sparkline, { props: { points: [1, 4, 2, 6] } })
    expect(w.find('polyline,path').exists()).toBe(true)
  })
  it('AreaChart renders an area path from points', () => {
    const w = mount(AreaChart, { props: { points: [40, 54, 46, 78] } })
    expect(w.findAll('path').length).toBeGreaterThanOrEqual(1)
  })
  it('KpiStat shows value + delta with direction', () => {
    const up = mount(KpiStat, { props: { label: 'WIP', value: '1,240', deltaPct: 3.2 } })
    expect(up.text()).toContain('1,240'); expect(up.text()).toContain('3.2')
    const down = mount(KpiStat, { props: { label: 'X', value: '1', deltaPct: -1.1 } })
    expect(down.html()).toMatch(/stop|rose|▼|down/i)
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- viz/viz` → FAIL.

- [ ] **Step 3: implement**

`src/lib/viz/Gauge.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ value: number; label?: string; max?: number }>()
const R = 44, C = 2 * Math.PI * R
const offset = computed(() => C * (1 - Math.min(1, props.value / (props.max ?? 100))))
</script>
<template>
  <svg width="104" height="104" viewBox="0 0 104 104">
    <circle cx="52" cy="52" :r="R" fill="none" stroke="rgba(30,41,80,.10)" stroke-width="10" />
    <circle cx="52" cy="52" :r="R" fill="none" stroke="url(#gaugeg)" stroke-width="10" stroke-linecap="round"
      :stroke-dasharray="C" :stroke-dashoffset="offset" transform="rotate(-90 52 52)" />
    <defs><linearGradient id="gaugeg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6366f1" /><stop offset="1" stop-color="#06b6d4" /></linearGradient></defs>
    <text x="52" y="49" text-anchor="middle" font-size="21" font-weight="800" fill="currentColor">{{ value }}</text>
    <text x="52" y="64" text-anchor="middle" font-size="10" fill="hsl(var(--ink-3))">{{ label }}</text>
  </svg>
</template>
```
`src/lib/viz/Sparkline.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ points: number[]; width?: number; height?: number }>()
const w = computed(() => props.width ?? 80), h = computed(() => props.height ?? 24)
const d = computed(() => {
  const pts = props.points; if (!pts.length) return ''
  const min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1
  return pts.map((p, i) => `${(i / (pts.length - 1)) * w.value},${h.value - ((p - min) / span) * h.value}`).join(' ')
})
</script>
<template>
  <svg :width="w" :height="h" :viewBox="`0 0 ${w} ${h}`" preserveAspectRatio="none">
    <polyline :points="d" fill="none" stroke="hsl(var(--primary))" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
```
`src/lib/viz/AreaChart.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ points: number[] }>()
const W = 460, H = 150
const coords = computed(() => {
  const pts = props.points; if (!pts.length) return []
  const min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1
  return pts.map((p, i) => [ (i / (pts.length - 1)) * W, H - ((p - min) / span) * (H - 20) - 10 ] as [number, number])
})
const line = computed(() => coords.value.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0]},${c[1]}`).join(' '))
const area = computed(() => coords.value.length ? `${line.value} L${W},${H} L0,${H} Z` : '')
const last = computed(() => coords.value[coords.value.length - 1])
</script>
<template>
  <svg width="100%" :height="H" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none">
    <defs><linearGradient id="areag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(79,70,229,.35)" /><stop offset="1" stop-color="rgba(79,70,229,0)" /></linearGradient></defs>
    <g stroke="rgba(30,41,80,.08)"><line x1="0" y1="38" x2="460" y2="38" /><line x1="0" y1="76" x2="460" y2="76" /><line x1="0" y1="114" x2="460" y2="114" /></g>
    <path :d="area" fill="url(#areag)" />
    <path :d="line" fill="none" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle v-if="last" :cx="last[0]" :cy="last[1]" r="4" fill="#4f46e5" stroke="#fff" stroke-width="2" />
  </svg>
</template>
```
`src/lib/viz/KpiStat.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ label: string; value: string; deltaPct?: number }>()
const up = computed(() => (props.deltaPct ?? 0) >= 0)
</script>
<template>
  <div class="flex items-center justify-between gap-2">
    <span class="text-sm text-ink-2">{{ label }}</span>
    <span class="flex items-baseline gap-1.5">
      <span class="text-base font-bold">{{ value }}</span>
      <span v-if="deltaPct !== undefined" class="text-[10.5px] font-semibold"
        :class="up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
        :data-dir="up ? 'up' : 'down'">{{ up ? '▲' : '▼' }} {{ Math.abs(deltaPct) }}%</span>
    </span>
  </div>
</template>
```

- [ ] **Step 4: run + typecheck** — `npm test -- viz/viz && npm run typecheck` → PASS (4).

- [ ] **Step 5: Commit**
```bash
git add src/lib/viz
git commit -m "feat(viz): SVG 原语 Gauge/Sparkline/AreaChart/KpiStat

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: AppIcon + iconMap

**Files:** Create `src/lib/ui/iconMap.ts`, `src/lib/ui/AppIcon.vue`, `src/lib/ui/AppIcon.spec.ts`

- [ ] **Step 1: failing test `src/lib/ui/AppIcon.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppIcon from './AppIcon.vue'
describe('AppIcon', () => {
  it('renders a lucide svg for a known name', () => { expect(mount(AppIcon, { props: { name: 'factory' } }).find('svg').exists()).toBe(true) })
  it('renders the fallback svg for an unknown name', () => { expect(mount(AppIcon, { props: { name: 'zzz' } }).find('svg').exists()).toBe(true) })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- AppIcon` → FAIL.

- [ ] **Step 3: implement**

`src/lib/ui/iconMap.ts`:
```ts
import { Factory, LineChart, TrendingUp, Wrench, Package, Boxes, Book, FileText, Archive, Gauge, Activity, LayoutGrid, type LucideIcon } from 'lucide-vue-next'
const map: Record<string, LucideIcon> = { factory: Factory, 'line-chart': LineChart, 'trending-up': TrendingUp, wrench: Wrench, package: Package, boxes: Boxes, book: Book, 'file-text': FileText, archive: Archive, gauge: Gauge, activity: Activity }
export const FALLBACK_ICON = LayoutGrid
export function iconFor(name: string): LucideIcon { return map[name] ?? FALLBACK_ICON }
```
`src/lib/ui/AppIcon.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { iconFor } from './iconMap'
const props = defineProps<{ name: string }>()
const Cmp = computed(() => iconFor(props.name))
</script>
<template><component :is="Cmp" :stroke-width="2" /></template>
```

- [ ] **Step 4: run + typecheck** — `npm test -- AppIcon && npm run typecheck` → PASS (2). If `LucideIcon` type isn't exported under that name, use `import type { LucideIcon } from 'lucide-vue-next'` (it is exported in 0.460).

- [ ] **Step 5: Commit**
```bash
git add src/lib/ui/iconMap.ts src/lib/ui/AppIcon.vue src/lib/ui/AppIcon.spec.ts
git commit -m "feat(ui): AppIcon(按名解析 Lucide,未知回退)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: AppHeader

**Files:** Create `src/features/dashboard/AppHeader.vue`, `src/features/dashboard/AppHeader.spec.ts`

- [ ] **Step 1: failing test `src/features/dashboard/AppHeader.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '@/router'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import AppHeader from './AppHeader.vue'

describe('AppHeader', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  it('shows the admin link only for admins; shows user name', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const auth = useAuthStore()
    auth.currentUser = { employeeId: 'ADMIN1', displayNameZh: '亚当', displayNameEn: 'Adam', departmentCode: 'IT', roleCode: 'PORTAL_ADMIN', isAdmin: true } as any
    const w = mount(AppHeader, { global: { plugins: [router, i18n] } })
    expect(w.text()).toContain('亚当')
    expect(w.text()).toContain('管理')
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- AppHeader` → FAIL.

- [ ] **Step 3: `src/features/dashboard/AppHeader.vue`**
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Languages, Sun, Moon, Monitor, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useLabelsStore } from '@/stores/labels'
import { useTheme, type ThemeMode } from '@/lib/theme/useTheme'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Button from '@/lib/ui/Button.vue'

const router = useRouter()
const auth = useAuthStore()
const labels = useLabelsStore()
const { locale } = useI18n({ useScope: 'global' })
const { mode, setMode } = useTheme()
const name = computed(() => (locale.value === 'zh' ? auth.currentUser?.displayNameZh : auth.currentUser?.displayNameEn) ?? '')
const ThemeIcon = computed(() => (mode.value === 'light' ? Sun : mode.value === 'dark' ? Moon : Monitor))
function toggleLocale() { labels.setLocale(locale.value === 'zh' ? 'en' : 'zh') }
function cycleTheme() { const o: ThemeMode[] = ['light', 'dark', 'system']; setMode(o[(o.indexOf(mode.value) + 1) % o.length]) }
function logout() { auth.logout(); try { router.push('/login') } catch { /* no router in tests */ } }
</script>
<template>
  <GlassCard class="flex items-center justify-between p-3 sm:p-4">
    <div class="flex items-center gap-2.5">
      <span class="grid size-8 place-items-center rounded-lg bg-brand font-extrabold text-white shadow-lg shadow-indigo-500/25">C</span>
      <b class="text-lg">CIM 门户</b>
    </div>
    <nav class="flex items-center gap-1.5">
      <RouterLink v-if="auth.isAdmin" to="/admin" class="mr-1 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white">{{ '管理' }}</RouterLink>
      <Button variant="ghost" class="gap-1" @click="toggleLocale"><Languages class="size-4" /> {{ locale === 'zh' ? 'EN' : '中' }}</Button>
      <Button variant="ghost" @click="cycleTheme"><component :is="ThemeIcon" class="size-4" /></Button>
      <span class="px-1 text-sm text-ink-2">{{ name }} · {{ auth.currentUser?.employeeId }}</span>
      <Button variant="ghost" @click="logout"><LogOut class="size-4" /></Button>
    </nav>
  </GlassCard>
</template>
```

- [ ] **Step 4: run + typecheck + full suite** — `npm test -- AppHeader && npm run typecheck && npm test` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/dashboard/AppHeader.vue src/features/dashboard/AppHeader.spec.ts
git commit -m "feat(dashboard): AppHeader(玻璃顶栏 + 语言/主题/管理/退出)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: HeroPanel(实时数据可视化)

**Files:** Create `src/features/dashboard/HeroPanel.vue`, `src/features/dashboard/HeroPanel.spec.ts`

- [ ] **Step 1: failing test `src/features/dashboard/HeroPanel.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { i18n } from '@/lib/i18n'
import { useAuthStore } from '@/stores/auth'
import HeroPanel from './HeroPanel.vue'

describe('HeroPanel', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh' })
  it('greets the user and renders the OEE gauge + KPIs (sample)', async () => {
    const auth = useAuthStore()
    auth.currentUser = { employeeId: 'OP1', displayNameZh: '欧阳操作', displayNameEn: 'O', departmentCode: 'FAB1-PROD', roleCode: 'OPERATOR', isAdmin: false } as any
    const w = mount(HeroPanel, { global: { plugins: [i18n] } })
    await flushPromises()
    expect(w.text()).toContain('欧阳操作')
    expect(w.find('svg').exists()).toBe(true)
    expect(w.text()).toContain('87.4')   // sample OEE
    expect(w.text()).toContain('示例')    // SAMPLE label (honest)
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- HeroPanel` → FAIL.

- [ ] **Step 3: `src/features/dashboard/HeroPanel.vue`**
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useClock } from '@/lib/composables/useClock'
import { createMetricsProvider, type PortalMetrics } from '@/lib/metrics'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Gauge from '@/lib/viz/Gauge.vue'
import KpiStat from '@/lib/viz/KpiStat.vue'
import AreaChart from '@/lib/viz/AreaChart.vue'

const { locale } = useI18n({ useScope: 'global' })
const auth = useAuthStore()
const { time, weekday } = useClock()
const metrics = ref<PortalMetrics | null>(null)
const name = computed(() => (locale.value === 'zh' ? auth.currentUser?.displayNameZh : auth.currentUser?.displayNameEn) ?? '')
const greeting = computed(() => { const h = new Date().getHours(); return h < 6 ? '凌晨好' : h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好' })
onMounted(async () => { metrics.value = await createMetricsProvider().getMetrics() })
</script>
<template>
  <GlassCard class="animate-fade-up grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1.05fr_1.35fr]">
    <div class="lg:border-r lg:border-white/40 lg:pr-5">
      <div class="flex items-center justify-between">
        <span class="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          <span class="size-1.5 rounded-full bg-emerald-500" style="animation: pulse-dot 1.8s infinite"></span>实时概览 · LIVE</span>
        <span class="font-mono text-sm tabular-nums text-ink-2">{{ time }} · {{ weekday }}</span>
      </div>
      <h2 class="mt-2 text-lg font-bold">{{ greeting }}<template v-if="name">,{{ name }}</template></h2>
      <p class="text-xs text-ink-3">{{ auth.currentUser?.departmentCode }} · {{ auth.currentUser?.roleCode }}</p>
      <div v-if="metrics" class="mt-4 flex items-center gap-4">
        <Gauge :value="metrics.oeePct" label="OEE %" />
        <div class="flex-1 space-y-2">
          <KpiStat label="在制品 WIP" :value="String(metrics.wip)" :delta-pct="metrics.wipDeltaPct" />
          <KpiStat label="良率 Yield" :value="metrics.yieldPct + '%'" :delta-pct="metrics.yieldDeltaPct" />
          <KpiStat label="本班产量" :value="metrics.throughput" :delta-pct="metrics.throughputDeltaPct" />
        </div>
      </div>
    </div>
    <div>
      <div class="mb-1 flex items-center justify-between">
        <b class="text-sm">本班产出趋势</b>
        <span v-if="metrics?.sample" class="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-300">示例数据 SAMPLE</span>
      </div>
      <AreaChart v-if="metrics" :points="metrics.shiftOutput" />
    </div>
  </GlassCard>
</template>
```

- [ ] **Step 4: run + typecheck** — `npm test -- HeroPanel && npm run typecheck` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/dashboard/HeroPanel.vue src/features/dashboard/HeroPanel.spec.ts
git commit -m "feat(dashboard): HeroPanel(LIVE + 时钟 + OEE 仪表 + KPI + 区域图,SAMPLE 标注)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: DomainHighlights

**Files:** Create `src/features/dashboard/DomainHighlights.vue`, `src/features/dashboard/DomainHighlights.spec.ts`

- [ ] **Step 1: failing test `src/features/dashboard/DomainHighlights.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/lib/i18n'
import DomainHighlights from './DomainHighlights.vue'

const cats = [
  { categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [{ id: 1 }, { id: 2 }] },
  { categoryCode: 'QA', categoryLabelZh: '质量', categoryLabelEn: 'QA', links: [{ id: 3 }] },
] as any
describe('DomainHighlights', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh' })
  it('renders one card per category with its localized label + count', () => {
    const w = mount(DomainHighlights, { props: { categories: cats }, global: { plugins: [i18n] } })
    expect(w.text()).toContain('制造执行'); expect(w.text()).toContain('质量')
    expect(w.text()).toContain('2 个系统'); expect(w.findAll('svg').length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- DomainHighlights` → FAIL.

- [ ] **Step 3: `src/features/dashboard/DomainHighlights.vue`**
```vue
<script setup lang="ts">
import { useLocale } from '@/lib/i18n/useLocale'
import type { HomeCategory } from '@/lib/api/types'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'

defineProps<{ categories: HomeCategory[] }>()
const { pick } = useLocale()
const ICON: Record<string, string> = { MES: 'factory', QA: 'line-chart', SPC: 'line-chart', AMS: 'wrench', MAINTENANCE: 'wrench', LOGISTICS: 'boxes', REPORTS: 'file-text' }
const GRAD: Record<string, string> = { MES: 'linear-gradient(135deg,#6366f1,#8b5cf6)', QA: 'linear-gradient(135deg,#06b6d4,#3b82f6)', AMS: 'linear-gradient(135deg,#f59e0b,#ef4444)', LOGISTICS: 'linear-gradient(135deg,#10b981,#06b6d4)', REPORTS: 'linear-gradient(135deg,#8b5cf6,#ec4899)' }
function icon(c: HomeCategory) { return ICON[c.categoryCode] ?? 'boxes' }
function grad(c: HomeCategory) { return GRAD[c.categoryCode] ?? 'linear-gradient(135deg,#6366f1,#06b6d4)' }
</script>
<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    <GlassCard v-for="c in categories" :key="c.categoryCode" class="p-4 transition hover:-translate-y-0.5">
      <span class="mb-2.5 grid size-9 place-items-center rounded-xl text-white" :style="{ backgroundImage: grad(c) }"><AppIcon :name="icon(c)" class="size-5" /></span>
      <div class="text-sm font-semibold">{{ pick(c, 'categoryLabel') }}</div>
      <div class="mt-0.5 text-xs text-ink-3">{{ c.categoryCode }}</div>
      <div class="mt-2 text-xs font-semibold text-[hsl(var(--primary))]">{{ c.links.length }} 个系统 →</div>
    </GlassCard>
  </div>
</template>
```

- [ ] **Step 4: run + typecheck** — `npm test -- DomainHighlights && npm run typecheck` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/dashboard/DomainHighlights.vue src/features/dashboard/DomainHighlights.spec.ts
git commit -m "feat(dashboard): DomainHighlights(领域图标卡)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: SystemCard + SystemGrid

**Files:** Create `src/features/dashboard/SystemCard.vue`, `src/features/dashboard/SystemGrid.vue`, `src/features/dashboard/SystemGrid.spec.ts`

- [ ] **Step 1: failing test `src/features/dashboard/SystemGrid.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/lib/i18n'
import SystemGrid from './SystemGrid.vue'

const cats = [{ categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [
  { id: 1, code: 'mes-wip', nameZh: '在制品管理', nameEn: 'WIP', url: 'https://x', icon: 'factory', statusCode: 'ACTIVE', openInNewTab: true },
  { id: 2, code: 'old', nameZh: '旧门户', nameEn: 'Legacy', url: 'https://y', icon: 'archive', statusCode: 'DEPRECATED', openInNewTab: false },
] }] as any
describe('SystemGrid', () => {
  beforeEach(() => { i18n.global.locale.value = 'zh' })
  it('renders link cards with localized name + href/target + status', () => {
    const w = mount(SystemGrid, { props: { categories: cats }, global: { plugins: [i18n] } })
    expect(w.text()).toContain('在制品管理')
    const a = w.findAll('a')
    expect(a[0].attributes('href')).toBe('https://x'); expect(a[0].attributes('target')).toBe('_blank')
    expect(w.findAll('svg').length).toBeGreaterThanOrEqual(2)
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- SystemGrid` → FAIL.

- [ ] **Step 3: implement**

`src/features/dashboard/SystemCard.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { HomeLink } from '@/lib/api/types'
import { useLocale } from '@/lib/i18n/useLocale'
import GlassCard from '@/lib/ui/GlassCard.vue'
import AppIcon from '@/lib/ui/AppIcon.vue'
import StatusDot from '@/lib/ui/StatusDot.vue'
const props = defineProps<{ link: HomeLink }>()
const { pick } = useLocale()
const name = computed(() => pick(props.link, 'name'))
const statusText = computed(() => props.link.statusCode === 'ACTIVE' ? '运行中' : props.link.statusCode === 'MAINTENANCE' ? '维护中' : props.link.statusCode === 'DEPRECATED' ? '已停用' : props.link.statusCode)
</script>
<template>
  <a :href="link.url" :target="link.openInNewTab ? '_blank' : '_self'" rel="noopener noreferrer" class="block">
    <GlassCard class="flex items-center gap-3 p-3.5 transition hover:-translate-y-0.5">
      <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white"><AppIcon :name="link.icon" class="size-4.5" /></span>
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ name }}</span>
        <span class="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-2"><StatusDot :status="link.statusCode" /> {{ statusText }} · {{ link.code }}</span>
      </span>
    </GlassCard>
  </a>
</template>
```
`src/features/dashboard/SystemGrid.vue`:
```vue
<script setup lang="ts">
import { useLocale } from '@/lib/i18n/useLocale'
import type { HomeCategory } from '@/lib/api/types'
import SystemCard from './SystemCard.vue'
defineProps<{ categories: HomeCategory[] }>()
const { pick } = useLocale()
</script>
<template>
  <div class="space-y-6">
    <section v-for="c in categories" :key="c.categoryCode">
      <h3 class="mb-3 flex items-center gap-2 text-sm font-bold">
        <span class="h-4 w-1 rounded bg-brand"></span>{{ pick(c, 'categoryLabel') }}
        <span class="font-mono text-[10px] uppercase tracking-widest text-ink-3">{{ c.categoryCode }}</span>
      </h3>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SystemCard v-for="l in c.links" :key="l.id" :link="l" />
      </div>
    </section>
  </div>
</template>
```

- [ ] **Step 4: run + typecheck** — `npm test -- SystemGrid && npm run typecheck` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/dashboard/SystemCard.vue src/features/dashboard/SystemGrid.vue src/features/dashboard/SystemGrid.spec.ts
git commit -m "feat(dashboard): SystemCard + SystemGrid(玻璃链接卡 + 状态点)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: TrustStrip + GlobalSearch

**Files:** Create `src/features/dashboard/TrustStrip.vue`, `src/features/dashboard/GlobalSearch.vue`, `src/features/dashboard/GlobalSearch.spec.ts`

- [ ] **Step 1: failing test `src/features/dashboard/GlobalSearch.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GlobalSearch from './GlobalSearch.vue'
describe('GlobalSearch', () => {
  it('emits on input and shows result count + clears', async () => {
    const w = mount(GlobalSearch, { props: { query: 'wip', resultCount: 3 } })
    expect(w.text()).toContain('找到 3 个')
    await w.get('input').setValue('oee')
    expect(w.emitted('update:query')?.at(-1)).toEqual(['oee'])
    await w.get('[data-testid="search-clear"]').trigger('click')
    expect(w.emitted('update:query')?.at(-1)).toEqual([''])
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- GlobalSearch` → FAIL.

- [ ] **Step 3: implement**

`src/features/dashboard/GlobalSearch.vue`:
```vue
<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
defineProps<{ query: string; resultCount?: number }>()
const emit = defineEmits<{ 'update:query': [string] }>()
</script>
<template>
  <div class="relative flex items-center">
    <Search class="pointer-events-none absolute left-3 size-4 text-ink-3" />
    <input :value="query" type="text" placeholder="搜索系统、文档…"
      class="h-11 w-full rounded-xl border border-input glass-strong pl-10 pr-24 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @input="emit('update:query', ($event.target as HTMLInputElement).value)" />
    <span v-if="query" class="absolute right-10 text-xs text-ink-3">找到 {{ resultCount ?? 0 }} 个</span>
    <button v-if="query" type="button" data-testid="search-clear" class="absolute right-3 text-ink-3 hover:text-[hsl(var(--ink))]" @click="emit('update:query', '')"><X class="size-4" /></button>
  </div>
</template>
```
`src/features/dashboard/TrustStrip.vue`:
```vue
<script setup lang="ts">
import { ShieldCheck, Users, FileText, Activity, Award } from 'lucide-vue-next'
import GlassCard from '@/lib/ui/GlassCard.vue'
const items = [
  { icon: ShieldCheck, label: 'SSO 安全登录' }, { icon: Users, label: 'RBAC 角色权限' },
  { icon: FileText, label: '审计日志' }, { icon: Activity, label: '99.98% 可用率' }, { icon: Award, label: 'ISO 9001' },
]
</script>
<template>
  <GlassCard class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 p-3.5">
    <span v-for="it in items" :key="it.label" class="flex items-center gap-1.5 text-xs font-medium text-ink-2">
      <component :is="it.icon" class="size-3.5 text-[hsl(var(--primary))]" />{{ it.label }}</span>
  </GlassCard>
</template>
```

- [ ] **Step 4: run + typecheck** — `npm test -- GlobalSearch && npm run typecheck` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/features/dashboard/TrustStrip.vue src/features/dashboard/GlobalSearch.vue src/features/dashboard/GlobalSearch.spec.ts
git commit -m "feat(dashboard): TrustStrip(安全合规条)+ GlobalSearch(搜索)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: HomeView 组装(覆盖占位)

**Files:** Overwrite `src/features/dashboard/HomeView.vue`; overwrite `src/features/dashboard/HomeView.spec.ts`

- [ ] **Step 1: overwrite `src/features/dashboard/HomeView.spec.ts`**
```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw'
import { routes } from '@/router'
import { i18n } from '@/lib/i18n'
import { configureClient } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth'
import HomeView from './HomeView.vue'

const BASE = 'http://localhost:8080'
function mountHome() {
  const router = createRouter({ history: createMemoryHistory(), routes })
  return mount(HomeView, { global: { plugins: [router, i18n] } })
}
describe('HomeView', () => {
  beforeEach(() => { setActivePinia(createPinia()); i18n.global.locale.value = 'zh'
    configureClient({ baseUrl: BASE, getToken: () => 't', getLocale: () => 'zh', onUnauthorized: () => {} })
    const a = useAuthStore(); a.currentUser = { employeeId: 'OP1', displayNameZh: '欧阳操作', displayNameEn: 'O', departmentCode: 'FAB1-PROD', roleCode: 'OPERATOR', isAdmin: false } as any
    server.use(http.get(`${BASE}/api/portal/home`, () => HttpResponse.json({ categories: [
      { categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [
        { id: 1, code: 'mes-wip', nameZh: '在制品管理', nameEn: 'WIP', url: 'x', icon: 'factory', statusCode: 'ACTIVE', openInNewTab: true },
        { id: 2, code: 'mes-oee', nameZh: '设备效率', nameEn: 'OEE', url: 'x', icon: 'gauge', statusCode: 'ACTIVE', openInNewTab: true },
      ] } ] })))
  })
  it('renders hero + domains + systems, and filters by search', async () => {
    const w = mountHome(); await flushPromises()
    expect(w.text()).toContain('欧阳操作')      // hero greeting
    expect(w.text()).toContain('制造执行')      // domain + grid
    expect(w.text()).toContain('在制品管理')
    expect(w.text()).toContain('SSO')           // trust strip
    await w.get('input').setValue('在制品')
    expect(w.text()).toContain('在制品管理'); expect(w.text()).not.toContain('设备效率')
  })
  it('shows empty state when no systems', async () => {
    server.use(http.get(`${BASE}/api/portal/home`, () => HttpResponse.json({ categories: [] })))
    const w = mountHome(); await flushPromises()
    expect(w.text()).toContain('暂无可访问的系统')
  })
})
```

- [ ] **Step 2: run, confirm FAIL** — `npm test -- HomeView` → FAIL (placeholder).

- [ ] **Step 3: overwrite `src/features/dashboard/HomeView.vue`**
```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Inbox, AlertTriangle, RotateCw, SearchX } from 'lucide-vue-next'
import type { HomeCategory } from '@/lib/api/types'
import { getHome } from '@/lib/api/portal'
import { useLocale } from '@/lib/i18n/useLocale'
import GlassCard from '@/lib/ui/GlassCard.vue'
import Button from '@/lib/ui/Button.vue'
import Skeleton from '@/lib/ui/Skeleton.vue'
import AppHeader from './AppHeader.vue'
import HeroPanel from './HeroPanel.vue'
import DomainHighlights from './DomainHighlights.vue'
import SystemGrid from './SystemGrid.vue'
import TrustStrip from './TrustStrip.vue'
import GlobalSearch from './GlobalSearch.vue'

const { pick } = useLocale()
const categories = ref<HomeCategory[]>([])
const loading = ref(true); const error = ref(false); const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase(); if (!q) return categories.value
  return categories.value.map((c) => ({ ...c, links: c.links.filter((l) =>
    pick(l, 'name').toLowerCase().includes(q) || l.code.toLowerCase().includes(q) || pick(c, 'categoryLabel').toLowerCase().includes(q)) })).filter((c) => c.links.length > 0)
})
const resultCount = computed(() => filtered.value.reduce((n, c) => n + c.links.length, 0))
const noMatch = computed(() => !loading.value && !error.value && categories.value.length > 0 && filtered.value.length === 0)
async function load() { loading.value = true; error.value = false; try { categories.value = (await getHome()).categories } catch { error.value = true } finally { loading.value = false } }
onMounted(load)
</script>
<template>
  <div class="min-h-screen p-4 sm:p-6">
    <div class="mx-auto max-w-7xl space-y-5">
      <AppHeader />
      <template v-if="loading">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><Skeleton v-for="n in 8" :key="n" /></div>
      </template>
      <GlassCard v-else-if="error" class="mx-auto mt-6 max-w-md p-8 text-center">
        <AlertTriangle class="mx-auto size-10 text-rose-500" /><p class="mt-3 font-medium text-rose-500">加载失败</p>
        <Button class="mx-auto mt-4" @click="load"><RotateCw class="size-4" /> 重试</Button>
      </GlassCard>
      <template v-else>
        <HeroPanel />
        <GlobalSearch v-model:query="query" :result-count="resultCount" />
        <GlassCard v-if="categories.length === 0" class="mx-auto mt-4 max-w-md p-10 text-center">
          <Inbox class="mx-auto size-12 text-ink-3" /><p class="mt-3 text-ink-2">暂无可访问的系统</p>
        </GlassCard>
        <GlassCard v-else-if="noMatch" class="mx-auto mt-4 max-w-md p-10 text-center">
          <SearchX class="mx-auto size-12 text-ink-3" /><p class="mt-3 text-ink-2">无匹配系统</p>
        </GlassCard>
        <template v-else>
          <DomainHighlights v-if="!query" :categories="categories" />
          <SystemGrid :categories="filtered" />
        </template>
        <TrustStrip />
      </template>
    </div>
  </div>
</template>
```

- [ ] **Step 4: run + typecheck + full suite + build** — `npm test -- HomeView && npm run typecheck && npm test && npm run build` → HomeView 2/2; full suite green; build OK.

- [ ] **Step 5: Commit**
```bash
git add src/features/dashboard/HomeView.vue src/features/dashboard/HomeView.spec.ts
git commit -m "feat(dashboard): HomeView 组装(Hero + 领域 + 系统网格 + 搜索 + 安全条)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 全量验证 + 运行冒烟

- [ ] **Step 1: 全量门禁** — `cd /home/shane/Code/cim-portal/cim-portal-frontend && npm run verify` → typecheck 干净;全部单测绿;构建成功。

- [ ] **Step 2: 运行冒烟(后端需 `SPRING_PROFILES_ACTIVE=dev` 在 :8080)**

`npm run dev`(:5173)→ 登录 OP1 → 完整玻璃仪表盘:实时 Hero(OEE 仪表 + KPI + 区域图 + SAMPLE 标注)、领域高亮卡、系统网格(状态点)、搜索过滤、安全合规条;切语言/主题正常。停止:`fuser -k 5173/tcp`。

- [ ] **Step 3: Commit(若有小修)** — 无改动可跳过。

---

## 自检清单(Self-Review)

**规格覆盖(spec §5.2/§6/§7):** Hero 实时数据可视化 → Task 1(metrics/clock)+2(viz)+5(HeroPanel,含 SAMPLE 标注 §6);领域高亮 → Task 3(AppIcon)+6;系统网格 → Task 7;安全合规条 → Task 8(TrustStrip);全局搜索 → Task 8(GlobalSearch)+9(过滤);顶栏(语言/主题/管理/退出)→ Task 4;组装 + 状态(loading/empty/error/no-match)→ Task 9。

**占位符扫描:** 无 TODO/TBD;每步含完整代码。`LucideIcon` 类型导入有兜底说明。

**类型/钩子一致性:** `useClock{time,weekday}`、`PortalMetrics`/`createMetricsProvider`、viz props(`Gauge{value,label}`/`Sparkline{points}`/`AreaChart{points}`/`KpiStat{label,value,deltaPct}`)、`iconFor`/`AppIcon{name}`、`HomeCategory`/`HomeLink`、`pick`/`useLocale`、`AppHeader`(`管理`/姓名)、`GlobalSearch{query,resultCount}`+`update:query`、HomeView `filtered`/`resultCount`/`noMatch` 一致。**硬约束**(既有 19 测试 + 链接 href/target)在 Task 9 复测。
