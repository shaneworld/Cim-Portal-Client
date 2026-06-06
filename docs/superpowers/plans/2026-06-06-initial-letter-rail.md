# 首页首字母索引栏(A–Z)实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页右侧加一条固定的 A–Z(+`#`)首字母索引栏,点选字母按首字母过滤「所有系统」网格(与搜索 AND 组合)。

**Architecture:** 新增纯函数 `initialFor`(按 locale 取拼音/英文首字母,`pinyin-pro`)+ 展示组件 `LetterRail`(固定右侧、置灰不可用、高亮选中)+ `HomeView` 串联(`letter` ref、`available`/`filtered` computed)。

**Tech Stack:** Vue 3 + TS + Tailwind + vue-i18n + lucide + `pinyin-pro`(新增)+ Vitest/VTU。

**契约/现状:** spec `docs/superpowers/specs/2026-06-06-initial-letter-rail-design.md`。已存在:`@/lib/i18n/useLocale`(`pick`)、`@/lib/api/types`(`HomeCategory`/`HomeLink`)、`@/lib/ui/GlassCard.vue`、`HomeView`(`categories`/`query`/`filtered`/`resultCount`/`noMatch`,网格只剩「所有系统」SystemGrid)。**硬约束:既有 28 测试保持绿。** 仓库 `/home/shane/Code/cim-portal/cim-portal-frontend`(在 `master` 上新建 `letter-rail`)。门禁 `npm run typecheck && npm test`(触集成加 `npm run build`)。提交追加 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

---

## 文件结构

```
src/lib/i18n/initial.ts        # initialFor + availableInitials(纯函数)
src/lib/i18n/initial.spec.ts
src/lib/ui/LetterRail.vue      # 固定右侧 A–Z 索引栏(展示组件)
src/lib/ui/LetterRail.spec.ts
src/features/dashboard/HomeView.vue        # 集成 letter 过滤 + 渲染 LetterRail(修改)
src/features/dashboard/HomeView.spec.ts    # 扩展:字母过滤(修改)
package.json                   # + pinyin-pro(Task 1)
```

---

## Task 1: 安装 pinyin-pro

**Files:** Modify `package.json`(经 npm)

- [ ] **Step 1: 安装依赖**

Run:
```bash
cd /home/shane/Code/cim-portal/cim-portal-frontend
npm install pinyin-pro@^3.26.0
```
Expected: 安装成功,`package.json` 的 `dependencies` 出现 `pinyin-pro`。

- [ ] **Step 2: 验证可导入(jsdom 纯 JS)**

Run:
```bash
node -e "const {pinyin}=require('pinyin-pro'); console.log(pinyin('在制品',{pattern:'first',toneType:'none',type:'array'})[0])"
```
Expected: 打印 `z`。

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: 新增 pinyin-pro 依赖(拼音首字母)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: initialFor + availableInitials

**Files:** Create `src/lib/i18n/initial.ts`, `src/lib/i18n/initial.spec.ts`

- [ ] **Step 1: 写失败测试 `src/lib/i18n/initial.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { initialFor, availableInitials } from './initial'

describe('initialFor', () => {
  it('zh: 取中文名拼音首字母(大写)', () => {
    expect(initialFor('在制品管理', 'zh')).toBe('Z')
    expect(initialFor('设备综合效率', 'zh')).toBe('S')
    expect(initialFor('帮助文档', 'zh')).toBe('B')
  })
  it('zh: 拉丁/英文开头直接透传首字母', () => {
    expect(initialFor('SPC 分析', 'zh')).toBe('S')
  })
  it('en: 取英文名首字母(大写)', () => {
    expect(initialFor('WIP', 'en')).toBe('W')
    expect(initialFor('oee monitor', 'en')).toBe('O')
  })
  it('非字母首字符 → #;空串 → #', () => {
    expect(initialFor('123 报表', 'zh')).toBe('#')
    expect(initialFor('', 'en')).toBe('#')
  })
})

describe('availableInitials', () => {
  it('对名称集合求去重首字母集合', () => {
    const set = availableInitials(['在制品', 'SPC', '设备', '帮助'], 'zh')
    expect(set.has('Z')).toBe(true)
    expect(set.has('S')).toBe(true)   // 设备(S)+ SPC(S)
    expect(set.has('B')).toBe(true)
    expect(set.size).toBe(3)
  })
})
```

- [ ] **Step 2: 运行,确认 FAIL** — `npm test -- initial` → 模块不存在。

- [ ] **Step 3: 实现 `src/lib/i18n/initial.ts`**
```ts
import { pinyin } from 'pinyin-pro'
import type { Locale } from './index'

/** 名称首字母:zh 取首字符拼音首字母(拉丁透传),en 取首字符;非 A–Z → '#'。 */
export function initialFor(name: string, locale: Locale): string {
  const s = (name ?? '').trim()
  if (!s) return '#'
  let ch: string
  if (locale === 'zh') {
    const first = pinyin(s[0], { pattern: 'first', toneType: 'none', type: 'array' })[0]
    ch = (first ?? s[0]).charAt(0)
  } else {
    ch = s.charAt(0)
  }
  const up = ch.toUpperCase()
  return /^[A-Z]$/.test(up) ? up : '#'
}

/** 一组名称出现过的首字母集合。 */
export function availableInitials(names: string[], locale: Locale): Set<string> {
  return new Set(names.map((n) => initialFor(n, locale)))
}
```

注:`Locale` 由 `@/lib/i18n` 导出(`'zh' | 'en'`)。若该处未导出 `Locale` 类型,改为内联 `type Locale = 'zh' | 'en'`。

- [ ] **Step 4: 运行 + typecheck** — `npm test -- initial && npm run typecheck` → PASS。

- [ ] **Step 5: Commit**
```bash
git add src/lib/i18n/initial.ts src/lib/i18n/initial.spec.ts
git commit -m "feat(i18n): initialFor/availableInitials(拼音/英文首字母)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: LetterRail 组件

**Files:** Create `src/lib/ui/LetterRail.vue`, `src/lib/ui/LetterRail.spec.ts`

- [ ] **Step 1: 写失败测试 `src/lib/ui/LetterRail.spec.ts`**
```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LetterRail from './LetterRail.vue'

describe('LetterRail', () => {
  const available = new Set(['S', 'Z', 'B'])
  it('渲染 A–Z 全部字母', () => {
    const w = mount(LetterRail, { props: { available, active: null } })
    const btns = w.findAll('button[data-letter]')
    const letters = btns.map((b) => b.attributes('data-letter'))
    expect(letters).toContain('A'); expect(letters).toContain('Z')
    expect(btns.length).toBeGreaterThanOrEqual(26)
  })
  it('不可用字母禁用,可用字母可点并 emit select', async () => {
    const w = mount(LetterRail, { props: { available, active: null } })
    const A = w.get('button[data-letter="A"]')
    expect(A.attributes('disabled')).toBeDefined()
    const S = w.get('button[data-letter="S"]')
    expect(S.attributes('disabled')).toBeUndefined()
    await S.trigger('click')
    expect(w.emitted('select')?.at(-1)).toEqual(['S'])
  })
  it('active 字母带高亮类;清除键 emit 空串', async () => {
    const w = mount(LetterRail, { props: { available, active: 'S' } })
    expect(w.get('button[data-letter="S"]').classes().join(' ')).toMatch(/bg-brand|text-white/)
    await w.get('[data-testid="rail-clear"]').trigger('click')
    expect(w.emitted('select')?.at(-1)).toEqual([''])
  })
})
```

- [ ] **Step 2: 运行,确认 FAIL** — `npm test -- LetterRail` → 模块不存在。

- [ ] **Step 3: 实现 `src/lib/ui/LetterRail.vue`**
```vue
<script setup lang="ts">
import { X } from 'lucide-vue-next'
const props = defineProps<{ available: Set<string>; active: string | null }>()
const emit = defineEmits<{ select: [string] }>()
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#']
function pick(letter: string) { emit('select', letter) }
</script>

<template>
  <nav class="fixed right-1 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-0.5 md:flex">
    <button
      v-if="active"
      type="button"
      data-testid="rail-clear"
      class="mb-1 grid size-5 place-items-center rounded-full text-ink-3 hover:text-[hsl(var(--ink))]"
      @click="emit('select', '')"
    >
      <X class="size-3.5" />
    </button>
    <button
      v-for="l in LETTERS"
      :key="l"
      type="button"
      :data-letter="l"
      :disabled="!available.has(l)"
      class="grid size-5 place-items-center rounded-md text-[11px] font-semibold leading-none transition"
      :class="active === l
        ? 'bg-brand text-white shadow'
        : available.has(l)
          ? 'text-ink-2 hover:bg-[hsl(var(--primary)/0.12)] hover:text-[hsl(var(--primary))]'
          : 'cursor-default text-ink-3/40'"
      @click="available.has(l) && pick(l)"
    >
      {{ l }}
    </button>
  </nav>
</template>
```

- [ ] **Step 4: 运行 + typecheck** — `npm test -- LetterRail && npm run typecheck` → PASS(3)。

- [ ] **Step 5: Commit**
```bash
git add src/lib/ui/LetterRail.vue src/lib/ui/LetterRail.spec.ts
git commit -m "feat(ui): LetterRail(右侧 A–Z 固定索引栏)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: HomeView 集成字母过滤

**Files:** Modify `src/features/dashboard/HomeView.vue`; Modify `src/features/dashboard/HomeView.spec.ts`

当前 `HomeView.vue` 关键片段(供定位):
```
import GlobalSearch from './GlobalSearch.vue'
...
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
```
模板里:`<GlobalSearch v-model:query="query" :result-count="resultCount" />`,以及只剩的 `所有系统` `<section>` 含 `<SystemGrid :categories="filtered" />`。

- [ ] **Step 1: 写失败测试(扩展 `HomeView.spec.ts`,在现有 describe 内新增一个 it)**
```ts
  it('选字母按首字母过滤;清除恢复', async () => {
    server.use(http.get(`${BASE}/api/portal/home`, () => HttpResponse.json({ categories: [
      { categoryCode: 'MES', categoryLabelZh: '制造执行', categoryLabelEn: 'MES', links: [
        { id: 1, code: 'mes-wip', nameZh: '在制品管理', nameEn: 'WIP', url: 'x', icon: 'factory', statusCode: 'ACTIVE', openInNewTab: true },
        { id: 2, code: 'mes-oee', nameZh: '设备综合效率', nameEn: 'OEE', url: 'x', icon: 'gauge', statusCode: 'ACTIVE', openInNewTab: true },
      ] } ] })))
    const w = mountHome(); await flushPromises()
    // zh:在制品→Z、设备→S。点 S 仅留「设备综合效率」
    await w.get('button[data-letter="S"]').trigger('click')
    expect(w.text()).toContain('设备综合效率')
    expect(w.text()).not.toContain('在制品管理')
    // 清除恢复
    await w.get('[data-testid="rail-clear"]').trigger('click')
    expect(w.text()).toContain('在制品管理')
  })
```

- [ ] **Step 2: 运行,确认 FAIL** — `npm test -- HomeView` → 新 it 失败(无 `data-letter` 按钮)。

- [ ] **Step 3: 实现 — 改 `HomeView.vue`**

3a. script 顶部新增导入(在现有 import 之后):
```ts
import { initialFor, availableInitials } from '@/lib/i18n/initial'
import { useLocale } from '@/lib/i18n/useLocale'
import LetterRail from '@/lib/ui/LetterRail.vue'
```
(`useLocale` 已导入则复用;此处额外取 `locale`。)

3b. 把 `const { pick } = useLocale()` 改为同时取 `locale`:
```ts
const { pick, locale } = useLocale()
```
(若 `useLocale` 未返回 `locale`,改用 `import { useI18n } from 'vue-i18n'` 并 `const { locale } = useI18n({ useScope: 'global' })`。)

3c. 新增 `letter` ref(放在 `query` 旁):
```ts
const letter = ref('')
```

3d. 重命名现有搜索过滤为 `searchFiltered`,并新增 `available` 与最终 `filtered`(替换原 `filtered`):
```ts
const searchFiltered = computed(() => {
  const q = query.value.trim().toLowerCase(); if (!q) return categories.value
  return categories.value.map((c) => ({ ...c, links: c.links.filter((l) =>
    pick(l, 'name').toLowerCase().includes(q) || l.code.toLowerCase().includes(q) || pick(c, 'categoryLabel').toLowerCase().includes(q)) })).filter((c) => c.links.length > 0)
})
const available = computed(() =>
  availableInitials(searchFiltered.value.flatMap((c) => c.links).map((l) => pick(l, 'name')), locale.value as 'zh' | 'en'))
const filtered = computed(() => {
  if (!letter.value) return searchFiltered.value
  return searchFiltered.value.map((c) => ({ ...c, links: c.links.filter((l) =>
    initialFor(pick(l, 'name'), locale.value as 'zh' | 'en') === letter.value) })).filter((c) => c.links.length > 0)
})
```
`resultCount` / `noMatch` 不变(仍引用 `filtered`)。

3e. 模板:在最外层容器内(`<div class="min-h-screen ...">` 之内、或紧跟根节点)加入 `LetterRail`,并接 toggle。把 `LetterRail` 放在 `所有系统` `<section>` 之后、`</template>` 之前即可(它是 fixed 定位,位置不影响):
```vue
        <LetterRail :available="available" :active="letter || null"
          @select="letter = (letter === $event ? '' : $event)" />
```
(`@select` 收到空串时 `letter === '' ? '' : ''` → 仍为 `''`,即清除;收到相同字母 → toggle 关闭;不同字母 → 切换。)

- [ ] **Step 4: 运行 + typecheck + 全量 + build**
```bash
npm test -- HomeView && npm run typecheck && npm test && npm run build
```
Expected: HomeView 新 it 通过;全量绿(原 28 + 本计划新增);build OK。

- [ ] **Step 5: Commit**
```bash
git add src/features/dashboard/HomeView.vue src/features/dashboard/HomeView.spec.ts
git commit -m "feat(dashboard): 首页接入 A–Z 首字母索引栏过滤(与搜索 AND)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 全量验证 + 运行冒烟

- [ ] **Step 1: 全量门禁** — `cd /home/shane/Code/cim-portal/cim-portal-frontend && npm run verify` → typecheck 干净;全部单测绿;build 成功。

- [ ] **Step 2: 运行冒烟(后端需 `SPRING_PROFILES_ACTIVE=dev` 在 :8080)**

`npm run dev`(:5173)→ 登录 OP1 → 桌面宽度下右侧出现 A–Z 栏:有系统的字母可点(如 Z「在制品」、S「设备/SPC」、B「帮助」),无系统字母置灰;点字母网格仅留匹配项,出现清除键,点清除恢复;字母与搜索框可叠加;切 EN 后字母随英文名变化。停止:`fuser -k 5173/tcp`。

- [ ] **Step 3: Commit(如有小修)** — 无改动可跳过。

---

## 自检清单(Self-Review)

**规格覆盖(spec):** 首字母来源(zh 拼音/en 英文,`#` 桶)→ Task 2 `initialFor`;索引栏置灰判断 → Task 2 `availableInitials` + Task 3;固定右侧、置灰、高亮、清除、仅桌面 → Task 3 `LetterRail`;过滤(与搜索 AND)、`available` 基于搜索后集合、空类别隐藏、locale 重算 → Task 4 `HomeView`;`pinyin-pro` 依赖 → Task 1;测试三处 + 既有保持绿 → Task 2/3/4 + Task 5。

**占位符扫描:** 无 TODO/TBD;每步含完整代码。`Locale` 导入与 `locale` 获取均给出兜底方案。

**类型/命名一致性:** `initialFor(name, locale)` / `availableInitials(names, locale)`、`LetterRail` props `available:Set<string>`/`active:string|null`、emit `select:[string]`、`data-letter`/`data-testid="rail-clear"`、HomeView `letter`/`searchFiltered`/`available`/`filtered` 在 Task 2/3/4 间一致。**硬约束**(既有测试、搜索过滤逻辑保留)在 Task 4/5 复测。
