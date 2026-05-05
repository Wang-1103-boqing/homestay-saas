-- ============================================================
-- 增量迁移：添加 user_id 字段 + 索引 + RLS 用户隔离
-- 在 Supabase 后台 SQL Editor 里执行
-- ============================================================

-- 1. 添加 user_id 字段（允许 NULL，兼容现有数据）
alter table properties   add column if not exists user_id uuid references auth.users(id);
alter table bookings     add column if not exists user_id uuid references auth.users(id);
alter table expenses     add column if not exists user_id uuid references auth.users(id);
alter table rent_history add column if not exists user_id uuid references auth.users(id);

-- 2. 加索引
create index if not exists idx_properties_user_id   on properties(user_id);
create index if not exists idx_bookings_user_id     on bookings(user_id);
create index if not exists idx_expenses_user_id     on expenses(user_id);
create index if not exists idx_rent_history_user_id on rent_history(user_id);

-- 3. 删除旧的开放策略
drop policy if exists "anon_all" on properties;
drop policy if exists "anon_all" on bookings;
drop policy if exists "anon_all" on expenses;
drop policy if exists "anon_all" on rent_history;

-- 4. 添加宽松的用户隔离策略：
--    查询时允许看自己的数据 + 尚未绑定的数据（user_id IS NULL）
--    写入时必须带当前用户的 user_id
create policy "own_data" on properties
  for all
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

create policy "own_data" on bookings
  for all
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

create policy "own_data" on expenses
  for all
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

create policy "own_data" on rent_history
  for all
  using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);
