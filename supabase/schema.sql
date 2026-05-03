-- ============================================================
-- 民宿管家 · Supabase 数据表
-- 在 Supabase 后台 SQL Editor 里执行此文件（一次即可）
-- ============================================================

-- 1. properties 房源
create table if not exists properties (
  id              text primary key,
  name            text        not null,
  type            text        not null default 'room',
  capacity        integer     not null default 2,
  price_per_night numeric     not null default 0,
  status          text        not null default 'available',
  description     text        not null default '',
  cover_color     text        not null default '#1677ff',
  monthly_rent    numeric     not null default 0,
  created_at      timestamptz          default now()
);

-- 2. bookings 预订记录
create table if not exists bookings (
  id              text primary key,
  property_id     text        not null references properties(id) on delete cascade,
  guest_name      text        not null,
  guest_phone     text        not null default '',
  check_in        date        not null,
  check_out       date        not null,
  total_amount    numeric     not null default 0,
  paid_amount     numeric     not null default 0,
  payment_method  text        not null default 'wechat',
  payment_status  text        not null default 'paid',
  notes           text        not null default '',
  booking_mode    text        not null default 'nightly',
  created_at      date                 default current_date
);

-- 3. expenses 支出记录
create table if not exists expenses (
  id              text primary key,
  property_id     text        not null references properties(id) on delete cascade,
  type            text        not null,
  date            date        not null,
  amount          numeric     not null default 0,
  description     text        not null default '',
  created_at      date                 default current_date
);

-- 4. rent_history 月租金变更历史
create table if not exists rent_history (
  id               text primary key,
  property_id      text        not null references properties(id) on delete cascade,
  amount           numeric     not null,
  effective_month  text        not null,
  created_at       date                 default current_date
);

-- ============================================================
-- 开放匿名读写权限（单用户 demo，无需登录）
-- ============================================================
alter table properties  enable row level security;
alter table bookings    enable row level security;
alter table expenses    enable row level security;
alter table rent_history enable row level security;

create policy "anon_all" on properties    for all using (true) with check (true);
create policy "anon_all" on bookings      for all using (true) with check (true);
create policy "anon_all" on expenses      for all using (true) with check (true);
create policy "anon_all" on rent_history  for all using (true) with check (true);

-- ============================================================
-- 开启 Realtime（让前端实时同步）
-- ============================================================
alter publication supabase_realtime add table properties;
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table rent_history;
