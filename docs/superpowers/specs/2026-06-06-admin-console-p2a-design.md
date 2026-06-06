# P2a 管理控制台 — 外壳 + 链接/授权(Links & Grants)设计

**日期:** 2026-06-06
**状态:** 设计已确认,待用户审阅 → 实现计划
**背景:** P2 管理控制台分三步:**P2a = 管理外壳(侧边导航 + 布局 + admin API 客户端 + 共享弹窗/选择器原语)+ 链接 CRUD + 每条链接的访问授权管理**;P2b = 枚举 + 标签;P2c = 只读用户。本 spec 仅 P2a。`/admin` 当前是 HomeView 占位,将被替换。

## 1. 关键决策(已定)

| 主题 | 选择 |
|---|---|
| 分解 | P2a 外壳 + Links/Grants 优先;P2b 枚举/标签;P2c 只读用户(各自 spec→plan→build)。 |
| 导航 | **左侧玻璃侧边栏 + 嵌套路由**(`/admin/links` …),`/admin` → 重定向 `/admin/links`;含「← 返回门户」。 |
| 编辑形态 | **居中玻璃模态框**(reka-ui Dialog,**仅淡入淡出**,不从角落弹出——沿用既有弹窗偏好);链接字段 + 授权编辑区同框。 |
| 依赖 | 新增 **`reka-ui`**(无障碍 Dialog/Select 等)。 |

## 2. 后端契约(已核对,勿臆测)

管理端点(均 admin-only,`/api/admin/...`):
- **Links** `/api/admin/links`:`GET`(list,可选 `?categoryCode=`)、`GET /{id}`、`POST`、`PUT /{id}`、`DELETE /{id}`。
- **Grants**:`GET /{id}/grants`、`PUT /{id}/grants`(整组替换)、`POST /{id}/grants`(加一条)、`DELETE /{id}/grants/{grantId}`。

DTO(精确字段):
- `LinkResponse { id:number; code; nameZh; nameEn; url; icon; categoryCode; statusCode; sortOrder:number; openInNewTab:boolean; grants: GrantResponse[]; createdAt; updatedAt }` —— **list/get 已内联 grants**。
- `LinkRequest { code; nameZh; nameEn; url; icon; categoryCode; statusCode; sortOrder:number; openInNewTab:boolean }`(均必填,sortOrder int)。
- `GrantResponse { id:number; linkId:number; grantType:'DEPARTMENT'|'ROLE'; grantCode:string }`。
- `GrantRequest { grantType:'DEPARTMENT'|'ROLE'; grantCode:string }`。
- `GrantsReplaceRequest { grants: GrantRequest[] }`。
- 选择项来自 enums(`GET /api/enums/{category}` → `EnumValue[]`,既有 `listEnum`):**LINK_CATEGORY**(分类)、**LINK_STATUS**(状态)、**DEPARTMENT**、**ROLE**(授权 code)。`EnumValue { id; category; code; labelZh; labelEn; sortOrder; active }`。
- 错误:`ApiError.fieldErrors`(既有)用于表单字段级提示。

## 3. 组件与文件

```
src/lib/api/admin.ts            # Links + Grants 客户端 + 类型(镜像上面 DTO)
src/lib/ui/Modal.vue            # reka-ui Dialog,玻璃 + 仅淡入淡出
src/lib/ui/Select.vue           # reka-ui Select(选项 {value,label})
src/lib/ui/Switch.vue           # reka-ui Switch(openInNewTab)
src/lib/ui/ConfirmDialog.vue    # 删除确认(基于 Modal)
src/features/admin/AdminLayout.vue            # 侧边栏 + <RouterView>
src/features/admin/links/LinksAdminView.vue   # 链接表格 + 新建/编辑/删除
src/features/admin/links/LinkFormModal.vue    # 链接表单 + 授权编辑区
src/router/index.ts             # /admin 嵌套子路由(修改)
src/lib/api/types.ts            # 确保 EnumCategory 含 LINK_CATEGORY/LINK_STATUS/DEPARTMENT/ROLE(修改)
```
复用既有:`Button`/`Input`/`GlassCard`/`StatusDot`/`Badge`/`Toaster`(toast store)/`AppIcon`(图标预览)/`useLocale`(pick)。

## 4. admin.ts API 客户端

```ts
export interface GrantResponse { id:number; linkId:number; grantType:GrantType; grantCode:string }
export interface GrantInput { grantType:GrantType; grantCode:string }
export type GrantType = 'DEPARTMENT' | 'ROLE'
export interface AdminLink { id:number; code:string; nameZh:string; nameEn:string; url:string; icon:string; categoryCode:string; statusCode:string; sortOrder:number; openInNewTab:boolean; grants:GrantResponse[]; createdAt?:string; updatedAt?:string }
export interface LinkInput { code:string; nameZh:string; nameEn:string; url:string; icon:string; categoryCode:string; statusCode:string; sortOrder:number; openInNewTab:boolean }

listLinks(categoryCode?:string): Promise<AdminLink[]>        // GET /api/admin/links
createLink(body:LinkInput): Promise<AdminLink>               // POST /api/admin/links
updateLink(id:number, body:LinkInput): Promise<AdminLink>    // PUT /api/admin/links/{id}
deleteLink(id:number): Promise<void>                         // DELETE /api/admin/links/{id}
replaceGrants(id:number, grants:GrantInput[]): Promise<GrantResponse[]>  // PUT /api/admin/links/{id}/grants  body {grants}
```
(P2a 仅用 list/create/update/delete + replaceGrants;getGrants/addGrant/deleteGrant 端点存在但本期不单独用——grants 随 link list 内联读取,保存时整组 PUT 替换。)

## 5. 共享原语(reka-ui)

- **Modal.vue**:`DialogRoot/Portal/Overlay/Content`。`open`(v-model)、`title` slot、默认 slot、`footer` slot。样式:遮罩 `bg-black/40`,内容 `glass-strong` 玻璃卡居中(`fixed left-1/2 top-1/2 -translate-1/2`),**动画仅 opacity 淡入淡出**(复用 `.anim-fade` / data-state),无缩放/位移弹出。响应式 `w-full max-w-lg`,内容超高 `max-h-[85vh] overflow-y-auto`。Esc/点遮罩关闭。
- **Select.vue**:reka-ui `SelectRoot/Trigger/Portal/Content/Item`。props `modelValue`、`options:{value:string;label:string}[]`、`placeholder`。玻璃下拉,选中勾选。
- **Switch.vue**:reka-ui `SwitchRoot/Thumb`,`modelValue` 布尔,品牌色开态。
- **ConfirmDialog.vue**:基于 Modal,props `open`/`title`/`message`,emit `confirm`/`cancel`;危险按钮红色。

## 6. AdminLayout

`/admin` 渲染 AdminLayout:左侧玻璃侧边栏(宽 ~220px,`GlassCard`),项:**链接**(active)、枚举、标签、用户(后三者 P2b/P2c 启用——本期渲染为 disabled/置灰且不可点,标注「即将上线」)。顶部「← 返回门户」(RouterLink `/`)。右侧 `<RouterView>` 渲染区(`flex-1`,内边距)。响应式:`md+` 侧栏在左;`<md` 侧栏变顶部横向 nav(或抽屉)——移动端简化为顶部链接行。整页玻璃风、`min-h-screen`、复用渐变背景。

## 7. LinksAdminView

- 挂载 `listLinks()`(可选分类筛选 Select:LINK_CATEGORY 全部/某类)。
- 顶部:标题「链接管理」+「新建链接」按钮(开 LinkFormModal,create 模式)。
- 表格(玻璃卡内):列 = 名称(`pick(name)` + code 小字)、分类(categoryCode)、状态(`StatusDot` + statusCode)、授权数(`grants.length`)、排序(sortOrder)、操作(编辑/删除)。窄屏改为卡片式行。
- 编辑:开 LinkFormModal(edit 模式,带 link)。删除:ConfirmDialog → `deleteLink` → 刷新 + toast。
- 加载骨架 / 空态 / 错误态(复用既有玻璃态样式)。

## 8. LinkFormModal(核心)

- props:`open`、`link?:AdminLink`(无=create)。emit:`saved`、`update:open`。
- 本地表单 state:link 字段 + `grants: GrantInput[]`(create 默认空;edit 用 `link.grants` 映射为 GrantInput)。
- 字段:`code`(Input;edit 时只读)、`nameZh`/`nameEn`(Input)、`url`(Input)、`icon`(Select=iconMap 已知键集合,旁 `AppIcon` 预览)、`categoryCode`(Select←LINK_CATEGORY enums,显示 `pick(label)`)、`statusCode`(Select←LINK_STATUS)、`sortOrder`(number Input)、`openInNewTab`(Switch)。
- **授权编辑区:** 标题「访问授权」;每行 = grantType(Select DEPARTMENT/ROLE)+ grantCode(Select←对应 DEPARTMENT/ROLE enums)+ 删除按钮;「+ 添加授权」加空行。无授权时提示「无人可见,请至少添加一条」(非阻断)。
- **保存:** 校验必填 → create:`createLink(input)` 得 id;edit:`updateLink(link.id, input)`;随后 `replaceGrants(id, grants)` 整组替换;成功 emit `saved`(父刷新列表)、关闭、toast;`ApiError.fieldErrors` 映射到对应字段下方红字。
- enums(category/status/dept/role)在模态打开时拉取一次(可缓存于组件或简单 onMounted)。

## 9. 路由

```ts
{ path: '/admin', component: AdminLayout, meta: { admin: true }, children: [
  { path: '', redirect: '/admin/links' },
  { path: 'links', name: 'admin-links', component: LinksAdminView },
] }
```
既有 `installGuards` 的 `to.meta.admin` 检查:嵌套子路由继承父 `meta.admin`?Vue Router **不自动继承 meta 到子路由的 `to.meta`**——`to.meta` 是合并了所有匹配记录的 meta,故父 `meta.admin` 会出现在子路由的 `to.meta` 中(Vue Router 合并 matched 的 meta)。确认守卫用 `to.meta.admin` 仍生效。labels hydration 等既有守卫不变。

## 10. 测试

- **`admin.spec.ts`**(MSW):listLinks/createLink/updateLink/deleteLink/replaceGrants 命中正确方法+路径+body。
- **`Modal.spec.ts`**:open 时渲染内容、含淡入 class、无缩放/位移弹出类;关闭不渲染。**`Select`/`Switch`/`ConfirmDialog`** 基本交互(emit)。
- **`LinksAdminView.spec.ts`**:列表渲染(名称/分类/状态/授权数);点删除 → 确认 → 调 deleteLink;点新建/编辑开 modal。
- **`LinkFormModal.spec.ts`**:字段绑定;授权增删;保存(create)调 createLink 再 replaceGrants;edit 调 updateLink;fieldErrors 显示。
- **`AdminLayout.spec.ts`**:渲染导航项 + 返回门户;Links 项 active。
- 既有 28 测试保持绿。reka-ui 在 jsdom 可挂载(必要时 Teleport/Portal stub 或 `attachTo`)。

## 11. 不在范围内(YAGNI)

枚举/标签/用户管理(P2b/P2c);链接拖拽排序(用 sortOrder 数字);授权的细粒度 ALLOW/DENY UI(后端 grant 仅 type+code,默认 ALLOW 语义);批量操作;审计日志查看;后端改动。
