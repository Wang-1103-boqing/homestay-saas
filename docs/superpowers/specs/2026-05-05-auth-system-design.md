# 民宿管家 · 用户认证与数据隔离设计文档

## 背景

当前系统为单用户 demo，Supabase RLS 全开（`anon_all`），无登录概念。现需增加多用户支持，每人只能看到自己的数据。

## 约束（不可违反）

- 所有现有业务逻辑不能动：
  - `useEffect`、`useState` 里的逻辑
  - `supabase` 数据查询（第一阶段）
  - 收益计算、冲突检测、Excel 导出
  - 表单提交、删除、更新函数
- 只允许动：样式、JSX 结构、新增页面文件
- 分两阶段交付：先做登录/注册 UI，用户确认后再做数据隔离

## 技术方案

- **认证**：Supabase Auth（邮箱 + 密码）
- **状态管理**：Zustand（新建 `authStore`）
- **路由策略**：不引入 `react-router`，顶层条件渲染（改动最小）

---

## 第一阶段：登录/注册 UI + 认证流程

### 架构图

```
main.tsx
  └─ AuthGate (新增)
       ├─ 未登录 → LoginPage (新增)
       └─ 已登录 → App.tsx (完全不动内部逻辑)
```

### 1. AuthGate 组件（新增）

**职责**：
- 应用启动时检查 `supabase.auth.getSession()`
- 监听 `onAuthStateChange`，实时同步登录状态到 `authStore`
- 未登录渲染 `LoginPage`，已登录渲染 `App`

**文件**：`src/components/AuthGate.tsx`

### 2. 登录/注册页面（新增）

**文件**：`src/pages/Login.tsx`

**设计**：
- 单文件内通过 `isRegister` 状态切换登录/注册视图
- 登录：邮箱、密码、登录按钮、"去注册"链接
- 注册：邮箱、密码、确认密码、注册按钮、"去登录"链接
- 表单校验：前端校验密码一致性、邮箱格式
- 错误提示：Supabase 返回的错误信息（中文展示）

**视觉风格**（与现有 UI 完全一致）：
- 页面背景：`var(--bg)` #f4f2ed
- 卡片背景：`var(--card-bg)` #ffffff，圆角 `var(--radius)` 16px
- 主按钮：高度 52px，背景 `var(--green)` #3c6652，圆角 12px，白色文字
- 输入框：Ant Design `Input` 大尺寸，圆角 12px
- 整体居中，顶部展示 "民宿管家" Logo 字样（跟加载页一致）

### 3. 认证状态管理（新增）

**文件**：`src/store/authStore.ts`

```typescript
interface AuthState {
  user: User | null
  session: Session | null
  setAuth: (user: User | null, session: Session | null) => void
  clearAuth: () => void
}
```

### 4. Supabase 配置调整

**文件**：`src/lib/supabase.ts`

- `persistSession: true`（恢复 session 持久化）
- `autoRefreshToken: true`（恢复 token 自动刷新）
- 保留其他配置（超时、心跳等）不变

### 5. Header 增加退出登录

**文件**：`src/App.tsx`（仅改 JSX 结构，不动业务逻辑）

- Header 右侧，在 Bell 图标旁边新增 `LogOut` 图标（lucide-react）
- 点击后调用 `supabase.auth.signOut()`
- 图标颜色跟随现有风格：`var(--text-3)`，大小 16px

### 6. 第一阶段不碰的内容

- `src/lib/db.ts` 所有函数不动
- `supabase/schema.sql` 不动
- 4 张表结构不动
- RLS 策略不动（仍保持 `anon_all` 开放）
- 各页面组件内部逻辑不动

---

## 第二阶段：数据隔离（待用户确认后实施）

### 1. 数据库变更

4 张表统一新增字段：

```sql
alter table properties   add column user_id uuid references auth.users(id);
alter table bookings     add column user_id uuid references auth.users(id);
alter table expenses     add column user_id uuid references auth.users(id);
alter table rent_history add column user_id uuid references auth.users(id);

-- 加索引
create index idx_properties_user_id   on properties(user_id);
create index idx_bookings_user_id     on bookings(user_id);
create index idx_expenses_user_id     on expenses(user_id);
create index idx_rent_history_user_id on rent_history(user_id);
```

历史数据 `user_id` 设为 `null`，后续通过应用层强制写入当前用户 ID。

### 2. RLS 策略替换

删除现有 `anon_all` 策略，替换为用户级隔离：

```sql
drop policy if exists "anon_all" on properties;
drop policy if exists "anon_all" on bookings;
drop policy if exists "anon_all" on expenses;
drop policy if exists "anon_all" on rent_history;

create policy "own_data" on properties   for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_data" on bookings     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_data" on expenses     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own_data" on rent_history for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

### 3. 应用层查询改造

**文件**：`src/lib/db.ts`

- 各 `toDb` 映射函数注入 `user_id`
- 各查询增加 `.eq('user_id', currentUserId)` 过滤
- `fetchAll` 需要传入当前 userId，或在函数内部从 `authStore` 读取

### 4. AuthGate 数据加载时机

- 登录成功后，`AuthGate` 确保 `authStore.user` 已设置，再渲染 `App`
- `App` 内部的 `useEffect` 调用 `fetchAll()` 时，自动带上 userId 过滤

---

## 错误处理

- **网络错误**：登录/注册按钮显示 loading，失败展示错误信息（Ant Design `message.error`）
- **邮箱已注册**：Supabase 返回 `User already registered`，前端展示"该邮箱已注册"
- **邮箱/密码错误**：展示"邮箱或密码错误"
- **Session 过期**：`onAuthStateChange` 监听到 `SIGNED_OUT`，自动回到登录页

## 文件变更清单（第一阶段）

| 操作 | 文件 | 说明 |
|------|------|------|
| 新增 | `src/components/AuthGate.tsx` | 认证门卫，条件渲染 |
| 新增 | `src/pages/Login.tsx` | 登录/注册页面 |
| 新增 | `src/store/authStore.ts` | 认证状态管理 |
| 修改 | `src/lib/supabase.ts` | 开启 session 持久化 |
| 修改 | `src/App.tsx` | Header 加退出登录图标 |
| 修改 | `src/main.tsx` | 用 AuthGate 包裹 App |

---

*Spec written on 2026-05-05. Phase 1 (UI + auth flow) approved by user.*
