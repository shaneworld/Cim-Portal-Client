# P2b 管理控制台 — 枚举管理(Enums)设计

**日期:** 2026-06-06
**状态:** 设计已确认,待用户审阅 → 实现计划
**背景:** 续 P2a(管理外壳 + Links/Grants)。P2b 在 `/admin/enums` 加枚举 CRUD,启用侧栏「枚举」项,复用 P2a 外壳与原语(Modal/Select/Switch/ConfirmDialog/Input/Button)。仓库 `cim-portal-client`(前端)。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 分类切换 | **顶部 tabs 一行**(部门 / 角色 / 链接分类 / 链接状态 = `DEPARTMENT`/`ROLE`/`LINK_CATEGORY`/`LINK_STATUS`),点击载入该分类值表。 |
| 删除安全 | **确认 + 警示**:ConfirmDialog 提示「删除可能影响仍在使用该 code 的链接/授权」;不硬阻断(后端允许),管理员决定。 |

## 2. 后端契约(已核对)

- `GET /api/admin/enums/{category}` → `EnumValueResponse[]`(list,admin-only)。
- `POST /api/admin/enums/{category}`(201)→ 创建。
- `PUT /api/admin/enums/{category}/{id}` → 更新。
- `DELETE /api/admin/enums/{category}/{id}`(204)→ 删除(无引用校验)。
- `EnumValueResponse { id:number; category; code; labelZh; labelEn; sortOrder:number; active:boolean; createdAt; updatedAt }` —— 与前端既有 `EnumValue` 类型字段一致(`{id,category,code,labelZh,labelEn,sortOrder,active}`),复用。
- `EnumValueRequest { code; labelZh; labelEn; sortOrder:number; active:Boolean }`(均必填;`active` 省略默认 true)。`{category}` 路径段为 `EnumCategory`(`DEPARTMENT`/`ROLE`/`LINK_CATEGORY`/`LINK_STATUS`)。
- 错误:`ApiError.fieldErrors`(既有)。

## 3. 组件与文件

```
src/lib/api/admin.ts                          # 扩展:enum CRUD + EnumValueInput(改)
src/features/admin/enums/EnumsAdminView.vue   # tabs + 值表 + 新建/编辑/删除(新)
src/features/admin/enums/EnumFormModal.vue    # 枚举表单(新)
src/router/index.ts                           # + /admin/enums 子路由(改)
src/features/admin/AdminLayout.vue            # 枚举项 enabled:true(改)
+ 各 .spec.ts
```
复用:`@/lib/ui/{Modal,Input,Switch,Button,GlassCard,Badge}.vue`、`@/lib/ui/ConfirmDialog.vue`(`confirmLabel`/`tone` 已支持)、`@/stores/toast`(`push({type,message})`)、`@/lib/i18n/useLocale`(`pick`)、既有 `EnumValue`/`EnumCategory` 类型。

## 4. admin.ts 扩展(enum 客户端)

```ts
export interface EnumValueInput { code: string; labelZh: string; labelEn: string; sortOrder: number; active: boolean }
// 复用 types.ts 的 EnumValue 作为响应类型
listEnumValues(category: EnumCategory): Promise<EnumValue[]>            // GET /api/admin/enums/{category}
createEnumValue(category: EnumCategory, body: EnumValueInput): Promise<EnumValue>   // POST
updateEnumValue(category: EnumCategory, id: number, body: EnumValueInput): Promise<EnumValue>  // PUT /{id}
deleteEnumValue(category: EnumCategory, id: number): Promise<void>      // DELETE /{id}
```
(注意区别既有 `@/lib/api/enums` 的 `listEnum`——那是公开 `/api/enums/{category}`;此为 admin `/api/admin/enums`。)

## 5. 路由 + 侧栏

- 路由:在 `/admin` children 加 `{ path: 'enums', name: 'admin-enums', component: () => import('@/features/admin/enums/EnumsAdminView.vue') }`。
- AdminLayout:`枚举` nav 项 `enabled: true`(指向 `/admin/enums`);保留 `ListChecks` 图标。`用户` 仍置灰(P2c)。

## 6. EnumsAdminView

- `CATEGORIES`:`[{ code:'DEPARTMENT', label:'部门' }, { code:'ROLE', label:'角色' }, { code:'LINK_CATEGORY', label:'链接分类' }, { code:'LINK_STATUS', label:'链接状态' }]`。
- `active` ref(默认 `'DEPARTMENT'`);`values` ref;`loading`/`error`。
- 顶部:标题「枚举管理」+「新建」按钮(开 EnumFormModal,create,带当前 category)。
- tabs 行:4 个玻璃 tab,active 高亮(`bg-brand text-white`),点击设 `active` 并 `load()`。
- 值表(GlassCard,按 sortOrder 显示后端返回顺序):列 = `code`、中文(`labelZh`)、英文(`labelEn`)、排序(`sortOrder`)、状态(`active` → Badge「启用/停用」)、操作(编辑/删除)。
- 编辑:开 EnumFormModal(edit,带 value)。删除:ConfirmDialog(标题「删除枚举值」,message 含 code + 警示语,`confirm-label="删除"` 默认 danger)→ `deleteEnumValue` → 刷新 + toast。
- 加载骨架 / 空态 / 错误态(复用既有玻璃态)。

## 7. EnumFormModal

- props:`open`、`category: EnumCategory`、`value: EnumValue | null`(空=create)。emit:`update:open`、`saved`。
- 本地 form:`{ code, labelZh, labelEn, sortOrder, active }`;`watch(open)` 打开时按 `value` 填充或重置(默认 `sortOrder` = 当前列表 max+10 或 100、`active` true);`fieldErrors`。
- 字段:`code`(Input,edit 时只读)、中文名/英文名(Input)、排序(number Input)、`active`(Switch + 文案「启用」)。
- 保存:必填校验(code/labelZh/labelEn)→ `value ? updateEnumValue(category, value.id, input) : createEnumValue(category, input)` → toast 成功 → emit `saved` + 关闭;`ApiError.fieldErrors` 映射字段。
- 包在 `<Modal :open :title="value?'编辑枚举值':'新建枚举值'">`,footer 取消/保存。

## 8. 测试

- **`admin.spec.ts`(扩展)**:`listEnumValues('DEPARTMENT')` GET `/api/admin/enums/DEPARTMENT`;`createEnumValue` POST;`updateEnumValue` PUT `/{id}`;`deleteEnumValue` DELETE `/{id}`(命中路径 + body)。
- **`EnumsAdminView.spec.ts`**:默认载入 DEPARTMENT 行;点「角色」tab → 载入 ROLE(请求 `/api/admin/enums/ROLE`,渲染其值);删除 → 确认 → 调 DELETE。
- **`EnumFormModal.spec.ts`**:create 保存调 POST(带 category + body);edit 调 PUT;active Switch 影响 body。
- 既有 44 测试保持绿。

## 9. 不在范围内(YAGNI)

引用完整性校验/级联(后端不校验,UI 仅警示);拖拽排序(用 sortOrder 数字);批量导入/导出;P2c 只读用户(下一子项目);后端改动。
