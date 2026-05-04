# 民宿管家 UI 重设计实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将民宿管家 App 从蓝色工具感后台风格重设计为"墨绿静谧"风格，符合四五十岁女性民宿主理人的审美需求。

**Architecture:** 全量样式覆盖——用新 CSS 变量替换旧色彩系统，逐页重写各 page 组件的布局与样式，同时保持所有业务逻辑不变。CalendarView 从 table+rowspan 方案改为 div+绝对定位方案实现连续色块甘特图。

**Tech Stack:** React 19 + TypeScript + Ant Design 6 + lucide-react + Zustand + Supabase + dayjs

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `package.json` | 修改 | 添加 lucide-react 依赖 |
| `src/index.css` | 修改 | 替换全局 CSS 变量为新色彩系统 |
| `src/App.tsx` | 修改 | 新 Header（Logo型）+ TabBar（Lucide图标）+ 加载/错误状态 |
| `src/pages/CalendarView.tsx` | 修改 | 全量重写：div甘特图 + 绝对定位色块 + 今日居中滚动 |
| `src/pages/AddBooking.tsx` | 修改 | 表单字段样式更新 |
| `src/pages/BookingList.tsx` | 修改 | 搜索栏 + 预订卡片样式更新 |
| `src/pages/Properties.tsx` | 修改 | 房源列表卡片样式更新（保留 PropertyDetail 逻辑） |
| `src/pages/Revenue.tsx` | 修改 | 汇总卡（墨绿底）+ 入住率进度条 + 展开卡片样式 |

---

## Task 1: 安装 lucide-react

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd "/Users/wangboqing/Desktop/05_代码与工具/Claude Code test/homestay-saas"
npm install lucide-react
```

Expected: `added 1 package` 或类似输出，无 error。

- [ ] **Step 2: 验证可以正常 import**

```bash
node -e "require('./node_modules/lucide-react')" && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add lucide-react for icon system"
```

---

## Task 2: 更新全局 CSS 变量

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: 替换 :root 变量块**

将 `src/index.css` 中的 `:root { ... }` 替换为：

```css
:root {
  /* ── 主色彩 ── */
  --green:    #3c6652;
  --green2:   #2a4a3a;
  --green-l:  #e2ede7;
  --warm:     #c9a87c;
  --today:    #ff3b30;

  /* ── 背景 ── */
  --bg:       #f4f2ed;
  --card-bg:  #ffffff;

  /* ── 文字 ── */
  --text-1:   #2d2926;
  --text-2:   #6b6560;
  --text-3:   #9a8e85;

  /* ── 边框 ── */
  --border:   #e2ddd5;

  /* ── 旧变量保留兼容（逐步替换） ── */
  --primary:       #3c6652;
  --primary-light: #e2ede7;
  --success:       #3c6652;
  --success-light: #e2ede7;
  --warning:       #c9a87c;
  --warning-light: #fdf2e4;
  --danger:        #ff3b30;
  --danger-light:  #fff1f0;
  --bg:            #f4f2ed;
  --card-bg:       #ffffff;
  --text-2:        #6b6560;
  --text-3:        #9a8e85;
  --border:        #e2ddd5;

  /* ── 布局 ── */
  --tab-h:    60px;
  --header-h: 56px;
  --radius:   16px;
}
```

- [ ] **Step 2: 更新 body 背景色和字体**

找到 `html, body { ... }` 块，更新为：

```css
html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  font-family: -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif;
  font-size: 17px;
  color: var(--text-1);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
```

- [ ] **Step 3: 更新 Ant Design 覆盖样式中的颜色**

找到 `.ant-btn-lg` 等 antd 覆盖块，保持原有结构，仅将颜色 `#1677ff` 替换为 `#3c6652`（若有）。

- [ ] **Step 4: 构建验证**

```bash
cd "/Users/wangboqing/Desktop/05_代码与工具/Claude Code test/homestay-saas"
npm run build 2>&1 | tail -5
```

Expected: `✓ built in` 或无 TypeScript error。

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "style: update global CSS variables to 墨绿静谧 color system"
```

---

## Task 3: 重写 App.tsx — Header + TabBar + 状态页

**Files:**
- Modify: `src/App.tsx`

保留全部数据加载、Realtime 订阅逻辑，只改视觉部分。

- [ ] **Step 1: 在文件顶部添加 lucide-react import**

在 `src/App.tsx` 现有 import 后追加：

```tsx
import { Plus, Calendar, FileText, Home, DollarSign, Bell } from 'lucide-react'
```

- [ ] **Step 2: 替换 TABS 常量**

将现有 `TABS` 数组替换为：

```tsx
const TABS: { key: TabKey; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> }[] = [
  { key: 'add',        label: '新增', Icon: Plus },
  { key: 'calendar',   label: '日历', Icon: Calendar },
  { key: 'bookings',   label: '记录', Icon: FileText },
  { key: 'properties', label: '房源', Icon: Home },
  { key: 'revenue',    label: '收益', Icon: DollarSign },
]
```

- [ ] **Step 3: 替换加载中 JSX**

将 `if (loading)` 的 return 替换为：

```tsx
if (loading) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: 14,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green2)', letterSpacing: 3 }}>民宿管家</div>
      <div style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-3)', textTransform: 'uppercase' }}>Homestay Manager</div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 8 }}>正在连接数据库…</div>
    </div>
  )
}
```

- [ ] **Step 4: 替换错误页 JSX**

将 `if (error)` 的 return 替换为：

```tsx
if (error) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: 16, padding: 32,
    }}>
      <div style={{ fontSize: 17, color: 'var(--text-1)', textAlign: 'center', lineHeight: 1.6 }}>{error}</div>
      <button
        onClick={() => { setError(''); setLoading(true); reload().catch(() => setError('数据加载失败，请检查网络后重试')).finally(() => setLoading(false)) }}
        style={{
          height: 50, padding: '0 32px', borderRadius: 14, border: 'none',
          background: 'var(--green)', color: '#fff', fontSize: 16,
          fontWeight: 700, cursor: 'pointer',
        }}
      >
        重试
      </button>
    </div>
  )
}
```

- [ ] **Step 5: 替换顶部 Header JSX**

将 `{/* 顶部 Header */}` 的 div 替换为：

```tsx
{/* 顶部 Header */}
<div style={{
  height: 'var(--header-h)', background: 'var(--bg)',
  display: 'flex', alignItems: 'flex-end', padding: '0 18px 10px',
  borderBottom: '1px solid var(--border)',
  position: 'sticky', top: 0, zIndex: 100,
  justifyContent: 'space-between',
}}>
  <div>
    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green2)', letterSpacing: 3, lineHeight: 1 }}>
      民宿管家
    </div>
    <div style={{ fontSize: 8, letterSpacing: 2.5, color: 'var(--text-3)', textTransform: 'uppercase', marginTop: 2 }}>
      Homestay Manager
    </div>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
    <Bell size={16} color="var(--text-3)" />
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: realtimeOk ? 'var(--green)' : 'var(--warm)' }}>
      <div style={{ width: 4, height: 4, borderRadius: '50%', background: realtimeOk ? 'var(--green)' : 'var(--warm)' }} />
      {realtimeOk ? '实时同步' : '离线模式'}
    </div>
  </div>
</div>
```

- [ ] **Step 6: 替换底部 TabBar JSX**

将 `{/* 底部 TabBar */}` 的 div 替换为：

```tsx
{/* 底部 TabBar */}
<div style={{
  position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
  width: '100%', maxWidth: 540,
  background: 'var(--card-bg)', borderTop: '1px solid var(--border)',
  display: 'flex',
  height: 'calc(var(--tab-h) + env(safe-area-inset-bottom, 0px))',
  paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  zIndex: 200,
  boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
}}>
  {TABS.map((t) => {
    const active = tab === t.key
    return (
      <button
        key={t.key}
        onClick={() => setTab(t.key)}
        style={{
          flex: 1, border: 'none', background: 'transparent',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: '6px 0', gap: 4,
        }}
      >
        <t.Icon
          size={20}
          strokeWidth={active ? 2.2 : 1.8}
          color={active ? 'var(--green)' : 'var(--text-3)'}
        />
        <span style={{
          fontSize: 11,
          fontWeight: active ? 700 : 400,
          color: active ? 'var(--green)' : 'var(--text-3)',
        }}>
          {t.label}
        </span>
      </button>
    )
  })}
</div>
```

- [ ] **Step 7: 构建验证**

```bash
npm run build 2>&1 | tail -5
```

Expected: 无 TypeScript error。

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx
git commit -m "style: redesign App header (brand logo) and tabbar (lucide icons)"
```

---

## Task 4: 重写 CalendarView.tsx — 新甘特图

**Files:**
- Modify: `src/pages/CalendarView.tsx`

这是改动最大的一个文件。保留 `BookingPopup` 和 `RoomDetail` 组件的业务逻辑，全量重写布局和样式。新方案放弃 `<table>` + `rowspan`，改用 div 网格 + 绝对定位色块。

- [ ] **Step 1: 更新 import**

将文件顶部 import 替换为：

```tsx
import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import dayjs from 'dayjs'
import { useStore } from '../store/useStore'
import type { Booking } from '../types'
import DateRangePicker from '../components/DateRangePicker'
```

- [ ] **Step 2: 添加样式常量（文件顶部，import 后）**

```tsx
const ROW_H      = 26   // px per day row
const DATE_COL_W = 34   // px for date column
const MIN_COL_W  = 44   // minimum room column width

const NAV_BTN: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 7,
  background: 'var(--card-bg)', border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
}
const FIELD_BOX: React.CSSProperties = {
  border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px',
  fontSize: 15, width: '100%', boxSizing: 'border-box', background: '#fff',
  fontFamily: 'inherit', outline: 'none',
}
const LBL: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-3)', display: 'block',
  marginBottom: 4, marginTop: 12, fontWeight: 600, letterSpacing: 0.5,
}
```

- [ ] **Step 3: 重写 BookingPopup 组件**

将现有 `BookingPopup` 函数替换为（逻辑不变，样式更新）：

```tsx
function BookingPopup({
  booking, propColor, onClose, onSave,
}: {
  booking: Booking; propColor: string
  onClose: () => void; onSave: (updated: Booking) => void
}) {
  const [name, setName]       = useState(booking.guestName)
  const [checkIn, setCheckIn] = useState(booking.checkIn)
  const [checkOut, setCheckOut] = useState(booking.checkOut)
  const [amount, setAmount]   = useState(String(booking.totalAmount))
  const [notes, setNotes]     = useState(booking.notes)
  const mode = booking.bookingMode ?? 'nightly'

  const handleSave = () => {
    if (!name.trim()) { alert('请输入客人姓名'); return }
    if (!checkIn || !checkOut) { alert('请选择日期'); return }
    if (dayjs(checkOut).diff(dayjs(checkIn), 'day') <= 0) { alert('退房日期必须晚于入住日期'); return }
    onSave({ ...booking, guestName: name.trim(), checkIn, checkOut,
      totalAmount: Number(amount) || 0, paidAmount: Number(amount) || 0, notes })
    onClose()
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div style={{ width: '100%', maxWidth: 540, background: '#fff', borderRadius: '20px 20px 0 0', padding: '0 0 calc(20px + env(safe-area-inset-bottom, 0px))', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ height: 5, background: propColor, borderRadius: '20px 20px 0 0' }} />
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>预订详情</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={18} color="var(--text-3)" />
            </button>
          </div>
          <label style={LBL}>客人姓名</label>
          <input style={FIELD_BOX} value={name} onChange={(e) => setName(e.target.value)} />
          <label style={LBL}>入住 / 退房日期</label>
          <DateRangePicker checkIn={checkIn} checkOut={checkOut} mode={mode}
            onChange={(ci, co) => { setCheckIn(ci); setCheckOut(co) }} />
          <label style={LBL}>金额（元）</label>
          <input type="number" style={FIELD_BOX} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <label style={LBL}>备注</label>
          <textarea style={{ ...FIELD_BOX, height: 64, resize: 'none' }} value={notes}
            onChange={(e) => setNotes(e.target.value)} placeholder="无备注" />
          <button onClick={handleSave} style={{
            width: '100%', height: 48, marginTop: 14, borderRadius: 12, border: 'none',
            background: propColor, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            保存修改
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 重写 RoomDetail 组件（保持逻辑，更新样式）**

将现有 `RoomDetail` 函数替换为：

```tsx
function RoomDetail({ propId, baseMonth, onBack }: { propId: string; baseMonth: dayjs.Dayjs; onBack: () => void }) {
  const { properties, bookings } = useStore()
  const prop = properties.find((p) => p.id === propId)
  const monthStr = baseMonth.format('YYYY-MM')
  const monthBookings = bookings
    .filter((b) => b.propertyId === propId && b.checkIn.startsWith(monthStr))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
  const nights = (ci: string, co: string) => dayjs(co).diff(dayjs(ci), 'day')

  return (
    <div style={{ padding: '0 0 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ ...NAV_BTN, width: 36, height: 36, borderRadius: 10 }}>
          <ChevronLeft size={16} color="var(--text-2)" />
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{prop?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{baseMonth.format('YYYY年M月')} 入住详情</div>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {monthBookings.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 15, paddingTop: 60 }}>本月暂无预订</div>
        ) : monthBookings.map((b) => (
          <div key={b.id} style={{ background: 'var(--card-bg)', borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxShadow: '0 2px 16px rgba(42,74,58,0.08)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 5 }}>{b.guestName}</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>
              {dayjs(b.checkIn).format('M月D日')} → {dayjs(b.checkOut).format('M月D日')}
              <span style={{ color: 'var(--text-3)', marginLeft: 8, fontSize: 12 }}>{nights(b.checkIn, b.checkOut)} 晚{b.bookingMode === 'monthly' ? '（包月）' : ''}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--green)' }}>¥{b.totalAmount}</div>
            {b.notes ? <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{b.notes}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 完整替换主 CalendarView 函数**

将 `export default function CalendarView()` 及其全部内容替换为：

```tsx
export default function CalendarView() {
  const { properties, bookings, updateBooking } = useStore()
  const [monthOffset, setMonthOffset]   = useState(0)
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null)
  const [popupBooking, setPopupBooking] = useState<{ booking: Booking; color: string } | null>(null)

  const scrollRef   = useRef<HTMLDivElement>(null)
  const wrapRef     = useRef<HTMLDivElement>(null)
  const [colW, setColW] = useState(MIN_COL_W)

  const baseMonth   = dayjs().add(monthOffset, 'month').startOf('month')
  const daysInMonth = baseMonth.daysInMonth()
  const isCurMonth  = dayjs().format('YYYY-MM') === baseMonth.format('YYYY-MM')
  const todayIdx    = isCurMonth ? dayjs().date() - 1 : -1

  // Column width: fill evenly if ≤4 rooms, else fixed MIN_COL_W
  useLayoutEffect(() => {
    if (!wrapRef.current || properties.length === 0) return
    const w = wrapRef.current.clientWidth
    const n = properties.length
    setColW(n <= 4 ? Math.max(MIN_COL_W, Math.floor((w - DATE_COL_W) / n)) : MIN_COL_W)
  }, [properties.length])

  // Scroll today to vertical center on mount and month change
  useEffect(() => {
    if (!scrollRef.current || todayIdx < 0) return
    const HEADER_H = 34
    const todayMidY = HEADER_H + todayIdx * ROW_H + ROW_H / 2
    scrollRef.current.scrollTop = Math.max(0, todayMidY - scrollRef.current.clientHeight / 2)
  }, [monthOffset, todayIdx])

  // Compute booking blocks per property column
  const bookingBlocks = useMemo(() => {
    const mStart = baseMonth
    const mEnd   = baseMonth.add(daysInMonth, 'day')
    return properties.map((p) => {
      const relevant = bookings.filter((b) =>
        b.propertyId === p.id &&
        dayjs(b.checkIn).isBefore(mEnd) &&
        dayjs(b.checkOut).isAfter(mStart),
      )
      return relevant.map((b) => {
        const startIdx = Math.max(0, dayjs(b.checkIn).diff(mStart, 'day'))
        const endIdx   = Math.min(daysInMonth, dayjs(b.checkOut).diff(mStart, 'day'))
        return { booking: b, startIdx, nights: endIdx - startIdx }
      }).filter((x) => x.nights > 0)
    })
  }, [properties, bookings, baseMonth, daysInMonth])

  const totalBookings = useMemo(() => {
    const mStart = baseMonth
    const mEnd   = baseMonth.add(daysInMonth, 'day')
    return bookings.filter((b) =>
      dayjs(b.checkIn).isBefore(mEnd) && dayjs(b.checkOut).isAfter(mStart),
    ).length
  }, [bookings, baseMonth, daysInMonth])

  if (selectedPropId) {
    return <RoomDetail propId={selectedPropId} baseMonth={baseMonth} onBack={() => setSelectedPropId(null)} />
  }

  return (
    <div ref={wrapRef} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - var(--header-h) - var(--tab-h) - env(safe-area-inset-bottom, 0px))', overflow: 'hidden' }}>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px 6px', background: 'var(--bg)', flexShrink: 0 }}>
        <button style={NAV_BTN} onClick={() => setMonthOffset((o) => o - 1)}>
          <ChevronLeft size={13} color="var(--text-2)" />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{baseMonth.format('YYYY年M月')}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>共 {totalBookings} 笔预订</div>
        </div>
        <button style={NAV_BTN} onClick={() => setMonthOffset((o) => o + 1)}>
          <ChevronRight size={13} color="var(--text-2)" />
        </button>
      </div>

      {/* Single scroll container — header + grid scroll together */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'none' as const }}>
        <div style={{ minWidth: '100%', width: 'max-content', position: 'relative' }}>

          {/* Sticky header row */}
          <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, background: 'var(--card-bg)', borderBottom: '2px solid var(--green-l)' }}>
            <div style={{ width: DATE_COL_W, flexShrink: 0, position: 'sticky', left: 0, zIndex: 11, background: 'var(--card-bg)', borderRight: '1px solid var(--border)' }} />
            {properties.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPropId(p.id)}
                style={{ width: colW, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 1px 0', gap: 3, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 6.5, fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap' }}>{p.name}</span>
                <div style={{ width: '100%', height: 3, background: p.coverColor }} />
              </div>
            ))}
          </div>

          {/* Grid + booking overlays */}
          <div style={{ position: 'relative' }}>

            {/* Grid rows */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const isToday = i === todayIdx
              return (
                <div key={i} style={{ display: 'flex', height: ROW_H, borderBottom: isToday ? '2.5px solid var(--today)' : '1px solid var(--border)' }}>
                  <div style={{
                    width: DATE_COL_W, flexShrink: 0,
                    position: 'sticky', left: 0, zIndex: 3,
                    background: 'var(--bg)', borderRight: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: isToday ? 800 : 500,
                    color: isToday ? 'var(--today)' : 'var(--text-2)',
                  }}>
                    {isToday && (
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--today)', marginRight: 2, display: 'inline-block', flexShrink: 0 }} />
                    )}
                    {i + 1}
                  </div>
                  {properties.map((p) => (
                    <div key={p.id} style={{ width: colW, flexShrink: 0, background: 'var(--card-bg)', borderRight: '1px solid var(--border)' }} />
                  ))}
                </div>
              )
            })}

            {/* Booking block overlays — one continuous rounded rect per booking */}
            {properties.map((p, colIdx) =>
              (bookingBlocks[colIdx] ?? []).map(({ booking, startIdx, nights }) => (
                <div
                  key={booking.id}
                  onClick={() => setPopupBooking({ booking, color: p.coverColor })}
                  style={{
                    position: 'absolute',
                    left: DATE_COL_W + colIdx * colW + 2,
                    width: colW - 4,
                    top: startIdx * ROW_H + 2,
                    height: nights * ROW_H - 4,
                    background: p.coverColor,
                    borderRadius: 5,
                    padding: '3px 4px',
                    fontSize: 6, fontWeight: 700, color: '#fff',
                    overflow: 'hidden', zIndex: 2, cursor: 'pointer',
                    lineHeight: 1.2,
                  }}
                >
                  {booking.guestName}
                  {booking.bookingMode === 'monthly' && (
                    <div style={{ fontSize: 5, opacity: 0.85 }}>包月</div>
                  )}
                </div>
              ))
            )}

          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, padding: '6px 12px', background: 'var(--bg)', borderTop: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
        {properties.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: 'var(--text-2)' }}>
            <div style={{ width: 10, height: 3, borderRadius: 2, background: p.coverColor }} />
            {p.name}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: 'var(--text-2)' }}>
          <div style={{ width: 12, height: 2, background: 'var(--today)', borderRadius: 1 }} />
          今天
        </div>
      </div>

      {/* Booking detail popup */}
      {popupBooking && (
        <BookingPopup
          booking={popupBooking.booking}
          propColor={popupBooking.color}
          onClose={() => setPopupBooking(null)}
          onSave={(updated) => { updateBooking(updated); setPopupBooking(null) }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 6: 构建验证**

```bash
npm run build 2>&1 | tail -10
```

Expected: 无 TypeScript error（可能有 lint warning，忽略）。

- [ ] **Step 7: Commit**

```bash
git add src/pages/CalendarView.tsx
git commit -m "feat: rewrite CalendarView with div-based gantt, absolute booking blocks, today auto-scroll"
```

---

## Task 5: 重写 AddBooking.tsx 表单样式

**Files:**
- Modify: `src/pages/AddBooking.tsx`

保留所有业务逻辑，只更新样式。

- [ ] **Step 1: 添加 lucide-react import**

在文件现有 import 后追加：

```tsx
import { ChevronDown } from 'lucide-react'
```

- [ ] **Step 2: 更新 lbl 样式常量**

找到 `const lbl: React.CSSProperties = { ... }` 替换为：

```tsx
const lbl: React.CSSProperties = {
  fontSize: 10, color: 'var(--text-3)', fontWeight: 600,
  marginBottom: 5, display: 'block', letterSpacing: 0.5,
}
const fieldBox: React.CSSProperties = {
  background: 'var(--card-bg)', border: '1.5px solid var(--border)',
  borderRadius: 12, padding: '10px 13px',
  fontSize: 15, width: '100%', boxSizing: 'border-box' as const,
  fontFamily: 'inherit', outline: 'none', color: 'var(--text-1)',
}
```

- [ ] **Step 3: 更新页面外层容器和标题**

找到 `return (` 后的最外层 `<div style={{ padding: ... }}>` 替换其 style 为：

```tsx
style={{ padding: '16px 16px 100px', background: 'var(--bg)', minHeight: '100%' }}
```

在表单内容顶部加页面标题（在第一个表单字段之前插入）：

```tsx
<div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 18 }}>新增预订</div>
```

- [ ] **Step 4: 更新 Ant Design 组件的 style props**

找到所有 `<Select>` 和 `<Input>` 和 `<InputNumber>` 组件，在其 `style` prop 中添加/覆盖：

```tsx
// Select: 添加
style={{ width: '100%', borderRadius: 12 }}

// Input: 添加  
style={{ borderRadius: 12, borderColor: 'var(--border)' }}

// InputNumber: 添加
style={{ width: '100%', borderRadius: 12 }}
```

- [ ] **Step 5: 更新提交按钮样式**

找到提交按钮（`onClick={handleSubmit}` 的 Button 或 button），替换其 style 为：

```tsx
style={{
  width: '100%', height: 50, borderRadius: 14, border: 'none',
  background: 'var(--green)', color: '#fff', fontSize: 16,
  fontWeight: 700, cursor: 'pointer', marginTop: 8,
  boxShadow: '0 4px 16px rgba(60,102,82,0.28)',
}}
```

- [ ] **Step 6: 构建验证**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/AddBooking.tsx
git commit -m "style: update AddBooking form to 墨绿静谧 design"
```

---

## Task 6: 重写 BookingList.tsx 卡片样式

**Files:**
- Modify: `src/pages/BookingList.tsx`

- [ ] **Step 1: 添加 lucide-react import**

追加：

```tsx
import { Search, Edit2, Trash2 } from 'lucide-react'
```

- [ ] **Step 2: 更新页面容器**

找到 `return (` 后的外层容器 div，更新 style 为：

```tsx
style={{ padding: '14px 14px 100px', background: 'var(--bg)', minHeight: '100%' }}
```

- [ ] **Step 3: 替换搜索栏 JSX**

找到搜索框（含 `SearchOutlined` 或 `Input` 搜索），替换为：

```tsx
{/* 搜索栏 */}
<div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 7, border: '1px solid var(--border)', marginBottom: 12 }}>
  <Search size={13} color="var(--text-3)" />
  <input
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    placeholder="搜索客人姓名…"
    style={{ border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-1)', background: 'transparent', flex: 1, fontFamily: 'inherit' }}
  />
</div>
```

- [ ] **Step 4: 替换预订卡片 JSX**

找到 `filtered.map(...)` 的 return 内容，将每张卡片的 style 更新为：

```tsx
// 卡片外层
style={{ background: 'var(--card-bg)', borderRadius: 14, padding: '13px 14px', marginBottom: 10, boxShadow: '0 2px 16px rgba(42,74,58,0.08)' }}

// 客人姓名
style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}

// 房间·晚数
style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}

// 金额
style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)' }}

// 日期范围
style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'right' as const, marginTop: 1 }}

// 分割线
style={{ borderTop: '1px solid var(--border)', marginTop: 10, paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}

// 已确认 tag
style={{ fontSize: 10, padding: '2px 9px', borderRadius: 999, fontWeight: 600, background: 'var(--green-l)', color: 'var(--green)' }}

// 来源渠道
style={{ fontSize: 9, color: 'var(--text-3)' }}
```

- [ ] **Step 5: 替换操作按钮图标**

找到编辑/删除按钮中的 `<EditOutlined>` 和 `<DeleteOutlined>`，替换为：

```tsx
<Edit2 size={13} />   // 替换 EditOutlined
<Trash2 size={13} />  // 替换 DeleteOutlined
```

- [ ] **Step 6: 构建验证**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/BookingList.tsx
git commit -m "style: update BookingList cards and search bar to new design"
```

---

## Task 7: 重写 Properties.tsx 房源列表样式

**Files:**
- Modify: `src/pages/Properties.tsx`

只改房源列表卡片（`PropertyCard` 或列表 map 渲染部分）。`PropertyDetail` 内部逻辑保留，样式跟随全局变量自动更新。

- [ ] **Step 1: 添加 lucide-react import**

追加：

```tsx
import { Edit2, Plus, ChevronLeft, Trash2 } from 'lucide-react'
```

移除 `import { PlusOutlined, LeftOutlined, DeleteOutlined } from '@ant-design/icons'`

- [ ] **Step 2: 更新 COVER_COLORS 色板**

找到 `const COVER_COLORS = [...]`，替换为：

```tsx
const COVER_COLORS = [
  '#3c6652', '#c9a87c', '#7aab94', '#2a4a3a',
  '#a3c4b0', '#b5804d', '#8a6a4a', '#4a7a62',
]
```

- [ ] **Step 3: 替换 PropertyDetail 中的图标**

在 `PropertyDetail` 中：
- `<LeftOutlined />` → `<ChevronLeft size={16} />`
- `<DeleteOutlined />` → `<Trash2 size={14} />`

并更新返回按钮样式：

```tsx
style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
```

- [ ] **Step 4: 替换房源列表卡片渲染**

> 注意：先阅读 `Properties.tsx` 中房源列表渲染部分，确认点击进入详情的实际 state setter 名称（可能是 `setSelectedPropId` 或 `setSelectedProperty`），替换下方示例代码中对应的 `setSelectedId`。

找到房源列表中 `properties.map(...)` 的渲染，将每个房源卡片替换为：

```tsx
<div
  key={p.id}
  style={{ background: 'var(--card-bg)', borderRadius: 14, marginBottom: 10, overflow: 'hidden', boxShadow: '0 2px 16px rgba(42,74,58,0.08)', cursor: 'pointer' }}
  onClick={() => setSelectedId(p.id)}   // 或现有的点击逻辑
>
  {/* 封面色块 */}
  <div style={{ height: 64, background: `linear-gradient(135deg, ${p.coverColor}99, ${p.coverColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontSize: 28 }}>🏡</div>
  </div>
  <div style={{ padding: '10px 14px 12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{p.name}</div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
          日租 ¥{p.pricePerNight} · 月租 ¥{p.monthlyRent}
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); setSelectedId(p.id) }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
      >
        <Edit2 size={14} color="var(--text-3)" />
      </button>
    </div>
    <div style={{ display: 'flex', gap: 5 }}>
      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: 'var(--green-l)', color: 'var(--green)' }}>上架中</span>
      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: 'var(--bg)', color: 'var(--text-3)' }}>{p.type === 'entire' ? '整套' : p.type === 'room' ? '独立房间' : '床位'}</span>
    </div>
  </div>
</div>
```

- [ ] **Step 5: 替换"添加房源"按钮**

找到新增房源按钮，替换为：

```tsx
<button
  onClick={() => setShowAddModal(true)}  // 或现有的打开 modal 逻辑
  style={{ width: '100%', border: '1.5px dashed var(--border)', borderRadius: 14, padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13, background: 'transparent', cursor: 'pointer' }}
>
  <Plus size={14} color="var(--text-3)" />
  添加房源
</button>
```

- [ ] **Step 6: 构建验证**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add src/pages/Properties.tsx
git commit -m "style: update Properties list cards and icons to new design"
```

---

## Task 8: 重写 Revenue.tsx 收益页样式

**Files:**
- Modify: `src/pages/Revenue.tsx`

保留全部计算逻辑，替换样式。

- [ ] **Step 1: 添加 lucide-react import**

追加：

```tsx
import { ChevronLeft, ChevronRight, Download, ChevronDown, ChevronUp } from 'lucide-react'
```

移除 `import { LeftOutlined, RightOutlined } from '@ant-design/icons'`

- [ ] **Step 2: 替换月份导航**

找到月份导航 `<Button shape="circle" ...>` 替换为：

```tsx
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
  <button onClick={() => setMonthOffset((o) => o - 1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
    <ChevronLeft size={14} color="var(--text-2)" />
  </button>
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{baseMonth.format('YYYY年M月')}</div>
  </div>
  <button onClick={() => setMonthOffset((o) => o + 1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
    <ChevronRight size={14} color="var(--text-2)" />
  </button>
</div>
```

- [ ] **Step 3: 替换月度汇总卡片**

找到 `{/* 月度汇总卡片 */}` div，替换为：

```tsx
{/* 月度汇总卡片 */}
<div style={{ background: 'var(--green2)', borderRadius: 16, padding: '16px 16px 14px', marginBottom: 14, color: '#fff' }}>
  <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1, marginBottom: 10 }}>本月净收益</div>
  <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, marginBottom: 14, color: '#b8ddc8' }}>
    {summary.net >= 0 ? '+' : ''}¥{summary.net.toLocaleString()}
  </div>
  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
    {[
      { label: '总收入', value: summary.totalIncome },
      { label: '总成本', value: summary.totalCost },
    ].map((item) => (
      <div key={item.label} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 8px', textAlign: 'center' }}>
        <div style={{ fontSize: 9, opacity: 0.65, marginBottom: 3 }}>{item.label}</div>
        <div style={{ fontSize: 16, fontWeight: 800 }}>¥{item.value.toLocaleString()}</div>
      </div>
    ))}
  </div>
  <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
    {[
      { label: `房租（${properties.length} 间）`, value: summary.totalRent },
      { label: '物业水电暖气', value: summary.totalUtility },
      { label: '维修采购', value: summary.totalMaintenance },
      { label: '保洁', value: summary.totalCleaning },
    ].map((row) => (
      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ opacity: 0.65 }}>{row.label}</span>
        <span style={{ fontWeight: 600 }}>¥{row.value}</span>
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 4: 替换入住率区块**

找到 `{/* 入住率 */}` 区块，替换为：

```tsx
{/* 本月入住率 */}
<div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 0.5, marginBottom: 10 }}>本月入住率</div>

{properties.map((p) => {
  const cur  = calcOccupancy(p.id, baseMonth)
  const prev = calcOccupancy(p.id, prevMonth)
  const diff = cur.rate - prev.rate
  const trendColor = diff >= 0 ? 'var(--green)' : 'var(--warm)'
  return (
    <div key={p.id} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '11px 13px', marginBottom: 8, boxShadow: '0 1px 8px rgba(42,74,58,0.07)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.coverColor, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{p.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {diff !== 0 && <span style={{ fontSize: 11, fontWeight: 700, color: trendColor }}>{diff > 0 ? '↑' : '↓'}{Math.abs(diff)}%</span>}
          <span style={{ fontSize: 15, fontWeight: 800, color: p.coverColor }}>{cur.rate}%</span>
        </div>
      </div>
      {/* 本月进度条 */}
      <div style={{ height: 7, background: '#f0ece6', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ height: '100%', width: `${cur.rate}%`, background: p.coverColor, borderRadius: 4, minWidth: cur.rate > 0 ? 4 : 0, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 7 }}>已预订 {cur.booked} 天 / 共 {cur.days} 天</div>
      {/* 上月对比 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: 'var(--text-3)' }}>上月</span>
        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{prev.rate}%</span>
      </div>
      <div style={{ height: 4, background: '#f0ece6', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${prev.rate}%`, background: '#d5cfc8', borderRadius: 3, minWidth: prev.rate > 0 ? 3 : 0 }} />
      </div>
    </div>
  )
})}
```

- [ ] **Step 5: 替换各房间明细卡片**

找到 `{propStats.map((p) => {` 的渲染块，将卡片样式替换为：

```tsx
<div key={p.id} style={{ background: 'var(--card-bg)', borderRadius: 12, marginBottom: 10, overflow: 'hidden', boxShadow: '0 1px 8px rgba(42,74,58,0.07)' }}>
  <div style={{ height: 3, background: p.coverColor }} />
  <div style={{ padding: '11px 13px' }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 9 }}>{p.name}</div>
    <div style={{ display: 'flex', gap: 6, marginBottom: 9 }}>
      {[
        { label: '本月收入', value: p.income, color: 'var(--green)' },
        { label: '本月成本', value: p.cost,   color: 'var(--warm)' },
        { label: '净收益',   value: p.net,    color: p.net >= 0 ? 'var(--green)' : 'var(--warm)' },
      ].map((item) => (
        <div key={item.label} style={{ flex: 1, background: 'var(--bg)', borderRadius: 9, padding: '7px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: 'var(--text-3)', marginBottom: 3 }}>{item.label}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: item.color }}>
            {item.value < 0 ? '-' : ''}¥{Math.abs(item.value)}
          </div>
        </div>
      ))}
    </div>
    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 9 }}>
      房租 ¥{p.rent} · 变动支出 ¥{p.varCost}
    </div>
    {/* 展开按钮 */}
    <button
      onClick={() => toggleExpand(p.id)}
      style={{ width: '100%', height: 34, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', borderRadius: 9, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
    >
      {expandedIds.has(p.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      {expandedIds.has(p.id) ? '收起明细' : '展开支出明细'}
    </button>
    {/* 展开内容（保持原逻辑不变，只更新小样式） */}
    {expandedIds.has(p.id) && (
      <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: 'var(--text-2)', borderBottom: '1px solid #f5f5f5' }}>
          <span>房租（{monthStr}）</span>
          <span style={{ fontWeight: 600 }}>¥{p.rent}</span>
        </div>
        {p.exps.length === 0 ? (
          <div style={{ padding: '10px 0', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>本月无变动支出</div>
        ) : p.exps.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: 'var(--text-2)', borderBottom: '1px solid #f5f5f5' }}>
            <div>
              <span style={{ fontSize: 10, background: 'var(--bg)', color: 'var(--text-3)', padding: '1px 7px', borderRadius: 999, marginRight: 6 }}>
                {EXP_TYPE_LABEL[e.type] ?? e.type}
              </span>
              {e.description}
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{dayjs(e.date).format('M月D日')}</div>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--warm)', flexShrink: 0, marginLeft: 8 }}>¥{e.amount}</span>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
```

- [ ] **Step 6: 替换导出按钮**

找到导出 `<button onClick={handleExport} ...>`，替换 style 为：

```tsx
style={{
  width: '100%', height: 50, marginTop: 8, borderRadius: 14, border: 'none',
  background: 'var(--green)', color: '#fff', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  boxShadow: '0 4px 16px rgba(60,102,82,0.28)',
}}
```

并在按钮文字前加图标：

```tsx
<Download size={16} />
导出本月（{baseMonth.format('YYYY年M月')}）
```

- [ ] **Step 7: 构建验证**

```bash
npm run build 2>&1 | tail -5
```

Expected: 无 TypeScript error。

- [ ] **Step 8: Commit**

```bash
git add src/pages/Revenue.tsx
git commit -m "style: redesign Revenue page with dark green summary card and occupancy bars"
```

---

## Task 9: 整体视觉验证

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```

Expected: 服务器启动，浏览器打开 http://localhost:5173

- [ ] **Step 2: 逐页检查清单**

打开每个 Tab，确认：

| 页面 | 检查项 |
|------|--------|
| Header | 民宿管家 / HOMESTAY MANAGER / Bell图标 / 同步状态 |
| TabBar | 5个 Lucide 图标，激活色墨绿，未激活暖灰 |
| 新增预订 | 米色底，绿色描边输入框，绿色提交按钮 |
| 排期日历 | 表头+格子同步横滑，连续圆角色块，今日红线居中 |
| 预订记录 | 搜索栏，白色悬浮卡片，绿色金额 |
| 房源管理 | 封面渐变色块，绿色"上架中" tag |
| 收益明细 | 深绿汇总卡，入住率进度条+上月对比，展开明细 |

- [ ] **Step 3: 最终 Commit**

```bash
git add -A
git commit -m "chore: final UI redesign - 墨绿静谧 complete"
```
