# 管理控制台分页(Links + Enums)设计

**日期:** 2026-06-06
**状态:** 设计已确认,待用户审阅 → 实现计划
**背景:** 管理「链接」(LinksAdminView,~75 条)与「枚举」(EnumsAdminView,按分类)列表当前一次性全量渲染,过长。加**客户端分页**(每页 10),不改后端。仓库 `cim-portal-client`。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 分页方式 | **客户端**:沿用一次性拉全量,前端按页切片。无后端/DB 改动;翻页瞬时。 |
| 每页条数 | **10**(固定,无尺寸选择器)。 |
| 复用 | 共享 `Pagination.vue` 组件 + `usePagination` 组合式,Links/Enums 共用。 |

后端(已核对):`GET /api/admin/links`、`GET /api/admin/enums/{category}` 均返回完整 `List<>`,无 page/size 参数——保持不变。

## 2. 组件与文件

```
src/lib/composables/usePagination.ts     # 切片 + 越界回夹 + reset(新)
src/lib/ui/Pagination.vue                # prev/页码/next + 计数(新)
src/features/admin/links/LinksAdminView.vue    # 接入分页(改)
src/features/admin/enums/EnumsAdminView.vue    # 接入分页 + 切 tab reset(改)
+ usePagination.spec.ts / Pagination.spec.ts;扩展两 View 的 spec
```
复用:`@/lib/ui/Button.vue`、玻璃令牌。

## 3. usePagination 组合式

`src/lib/composables/usePagination.ts`:
```ts
import { ref, computed, watch, type Ref } from 'vue'
export function usePagination<T>(items: Ref<T[]>, pageSize = 10) {
  const page = ref(1)
  const total = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
  const paged = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize))
  // 列表变化(删除/刷新)后若当前页越界则回夹到末页
  watch(items, () => { if (page.value > totalPages.value) page.value = totalPages.value })
  function reset() { page.value = 1 }
  return { page, paged, total, totalPages, pageSize, reset }
}
```
契约:`page` 1-based;`paged` 当前页切片;`reset()` 回第 1 页。

## 4. Pagination 组件

`src/lib/ui/Pagination.vue`:
- props:`page: number`、`total: number`、`pageSize: number`。emits:`update:page: [number]`。
- 计算 `totalPages = max(1, ceil(total/pageSize))`;**`total <= pageSize` 时不渲染**(单页隐藏)。
- 渲染:`‹`(prev,`page<=1` disabled)+ 页码按钮 + `›`(next,`page>=totalPages` disabled)+ 右侧「共 {total} 条」。
- 页码窗口:`totalPages <= 7` 全显示;否则 `1 … (page-1) page (page+1) … totalPages`(用 `…` 占位,不可点)。
- 当前页按钮高亮 `bg-brand text-white`;其余 `glass-strong`/ghost;点击页码/箭头 `emit('update:page', n)`。
- `data-testid`:prev=`page-prev`、next=`page-next`、页码=`page-n-{n}`。

## 5. LinksAdminView 接入

- `import { usePagination } from '@/lib/composables/usePagination'` + `import Pagination from '@/lib/ui/Pagination.vue'`。
- `const { page, paged, total, pageSize } = usePagination(links, 10)`(`links` 为现有 `ref<AdminLink[]>`)。
- 列表 `v-for` 由 `links` 改为 **`paged`**;空态判断仍用 `links.length`(总数)。
- 表格 GlassCard 之后加:`<Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />`。
- 删除后 `load()` 刷新 → `watch` 自动回夹页码(无需手动 reset)。

## 6. EnumsAdminView 接入

- 同样 `const { page, paged, total, pageSize, reset } = usePagination(values, 10)`。
- 表格 `v-for` 由 `values` 改为 `paged`;空态用 `values.length`。
- `switchTo(c)` 内在 `load()` 前后调用 `reset()`(切分类回第 1 页)。新建/编辑/删除后 `load()` → watch 回夹。
- 表格后加 `<Pagination :page="page" :total="total" :page-size="pageSize" @update:page="page = $event" />`。

## 7. 测试

- **`usePagination.spec.ts`**:20 项、size 10 → `paged.length===10`、`totalPages===2`;`page=2` → 第 11–20 项;列表缩到 5 项后 `page` 回夹到 1;`reset()` 回 1。
- **`Pagination.spec.ts`**:`total<=pageSize` 不渲染;total=25/size=10 → 渲染,prev 在 page1 disabled、next 可点 emit 2;点 `page-n-3` emit 3;page=3(末页)next disabled。
- **`LinksAdminView.spec.ts`(扩展)**:mock 返回 12 条 → 默认显示 10 行;`@update:page` 到 2 → 显示剩余 2 行;`Pagination` 存在。(既有 1-2 条的用例分页隐藏,保持绿。)
- **`EnumsAdminView.spec.ts`(扩展)**:某分类 12 条 → 分页显示;切到另一分类 → 回第 1 页(`reset`)。
- 既有 48 测试保持绿。

## 8. 不在范围内(YAGNI)

服务端分页(后端不改);每页尺寸选择器(固定 10);URL/query 同步页码;无限滚动;搜索框(Links admin 无搜索,本次不加)。
