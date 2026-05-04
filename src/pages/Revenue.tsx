import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Download, ChevronDown, ChevronUp } from 'lucide-react'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { useStore } from '../store/useStore'
import type { Booking, RentHistory } from '../types'

const EXP_TYPE_LABEL: Record<string, string> = {
  utility:     '物业水电暖气',
  maintenance: '维修采购',
  cleaning:    '保洁',
}

function proportionalIncome(b: Booking, mStart: dayjs.Dayjs, mEnd: dayjs.Dayjs): number {
  const totalDays = dayjs(b.checkOut).diff(dayjs(b.checkIn), 'day')
  if (totalDays <= 0) return 0
  const ci = dayjs(b.checkIn).isBefore(mStart) ? mStart : dayjs(b.checkIn)
  const co = dayjs(b.checkOut).isAfter(mEnd) ? mEnd : dayjs(b.checkOut)
  const daysInMonth = co.diff(ci, 'day')
  if (daysInMonth <= 0) return 0
  return (b.totalAmount * daysInMonth) / totalDays
}

function getEffectiveRent(rentHistory: RentHistory[], propId: string, month: string): number {
  const records = rentHistory
    .filter((r) => r.propertyId === propId && r.effectiveMonth <= month)
    .sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))
  return records[0]?.amount ?? 0
}

const NAV_BTN: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 9,
  background: 'var(--card-bg)', border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
}

export default function Revenue() {
  const { properties, bookings, expenses, rentHistory } = useStore()
  const [monthOffset, setMonthOffset] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const baseMonth   = dayjs().add(monthOffset, 'month').startOf('month')
  const monthStr    = baseMonth.format('YYYY-MM')
  const daysInMonth = baseMonth.daysInMonth()
  const prevMonth   = baseMonth.subtract(1, 'month')

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(monthStr)),
    [expenses, monthStr],
  )

  const calcOccupancy = (propId: string, month: dayjs.Dayjs) => {
    const mStart = month
    const days   = month.daysInMonth()
    const mEnd   = month.add(days, 'day')
    const relevant = bookings.filter(
      (b) => b.propertyId === propId && dayjs(b.checkIn).isBefore(mEnd) && dayjs(b.checkOut).isAfter(mStart),
    )
    let booked = 0
    relevant.forEach((b) => {
      const ci = dayjs(b.checkIn).isBefore(mStart) ? mStart : dayjs(b.checkIn)
      const co = dayjs(b.checkOut).isAfter(mEnd) ? mEnd : dayjs(b.checkOut)
      booked += co.diff(ci, 'day')
    })
    return { booked, days, rate: Math.min(100, Math.round((booked / days) * 100)) }
  }

  const summary = useMemo(() => {
    const mStart = baseMonth
    const mEnd   = baseMonth.add(daysInMonth, 'day')
    const totalIncome = Math.round(
      bookings
        .filter((b) => dayjs(b.checkIn).isBefore(mEnd) && dayjs(b.checkOut).isAfter(mStart))
        .reduce((s, b) => s + proportionalIncome(b, mStart, mEnd), 0),
    )
    const totalRent        = properties.reduce((s, p) => s + getEffectiveRent(rentHistory, p.id, monthStr), 0)
    const totalUtility     = monthExpenses.filter((e) => e.type === 'utility').reduce((s, e) => s + e.amount, 0)
    const totalMaintenance = monthExpenses.filter((e) => e.type === 'maintenance').reduce((s, e) => s + e.amount, 0)
    const totalCleaning    = monthExpenses.filter((e) => e.type === 'cleaning').reduce((s, e) => s + e.amount, 0)
    const totalCost        = totalRent + totalUtility + totalMaintenance + totalCleaning
    return { totalIncome, totalRent, totalUtility, totalMaintenance, totalCleaning, totalCost, net: totalIncome - totalCost }
  }, [bookings, baseMonth, daysInMonth, monthExpenses, properties, rentHistory, monthStr])

  const propStats = useMemo(() => {
    const mStart = baseMonth
    const mEnd   = baseMonth.add(daysInMonth, 'day')
    return properties.map((p) => {
      const income  = Math.round(bookings.filter((b) => b.propertyId === p.id && dayjs(b.checkIn).isBefore(mEnd) && dayjs(b.checkOut).isAfter(mStart)).reduce((s, b) => s + proportionalIncome(b, mStart, mEnd), 0))
      const rent    = getEffectiveRent(rentHistory, p.id, monthStr)
      const varExps = monthExpenses.filter((e) => e.propertyId === p.id)
      const varCost = varExps.reduce((s, e) => s + e.amount, 0)
      const cost    = rent + varCost
      return { ...p, income, rent, varCost, cost, net: income - cost, exps: varExps }
    })
  }, [properties, bookings, baseMonth, daysInMonth, monthExpenses, rentHistory, monthStr])

  const handleExport = () => {
    const mStart  = baseMonth
    const mEnd    = baseMonth.add(daysInMonth, 'day')
    const propMap = Object.fromEntries(properties.map((p) => [p.id, p.name]))
    const overlapBookings = bookings.filter((b) => dayjs(b.checkIn).isBefore(mEnd) && dayjs(b.checkOut).isAfter(mStart))
    const bookingRows = overlapBookings.map((b) => {
      const totalDays = dayjs(b.checkOut).diff(dayjs(b.checkIn), 'day')
      const ci = dayjs(b.checkIn).isBefore(mStart) ? mStart : dayjs(b.checkIn)
      const co = dayjs(b.checkOut).isAfter(mEnd) ? mEnd : dayjs(b.checkOut)
      const daysThisMonth = co.diff(ci, 'day')
      const allocated = totalDays > 0 ? Math.round(b.totalAmount * daysThisMonth / totalDays) : 0
      return { '房源': propMap[b.propertyId] ?? b.propertyId, '客人姓名': b.guestName, '入住日期': b.checkIn, '退房日期': b.checkOut, '总晚数': totalDays, '本月入住天数': daysThisMonth, '总金额': b.totalAmount, '本月分摊金额': allocated, '预订方式': b.bookingMode === 'monthly' ? '包月' : '按晚', '备注': b.notes }
    })
    const expRows = monthExpenses.map((e) => ({ '房源': propMap[e.propertyId] ?? e.propertyId, '支出类型': EXP_TYPE_LABEL[e.type] ?? e.type, '日期': e.date, '金额': e.amount, '说明': e.description }))
    const summaryRows = [
      { '项目': '总收入（分摊）', '金额（元）': summary.totalIncome },
      { '项目': '房租',           '金额（元）': summary.totalRent },
      { '项目': '物业水电暖气',   '金额（元）': summary.totalUtility },
      { '项目': '维修采购',       '金额（元）': summary.totalMaintenance },
      { '项目': '保洁',           '金额（元）': summary.totalCleaning },
      { '项目': '总成本',         '金额（元）': summary.totalCost },
      { '项目': '净收益',         '金额（元）': summary.net },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bookingRows), '当月预订记录')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expRows), '当月支出记录')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), '当月收益汇总')
    XLSX.writeFile(wb, `民宿管家_${baseMonth.format('YYYY年M月')}.xlsx`)
  }

  return (
    <div style={{ padding: '14px 14px 100px', background: 'var(--bg)', minHeight: '100%' }}>

      {/* 月份导航 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button style={NAV_BTN} onClick={() => setMonthOffset((o) => o - 1)}>
          <ChevronLeft size={15} color="var(--text-2)" />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{baseMonth.format('YYYY年M月')}</div>
        </div>
        <button style={NAV_BTN} onClick={() => setMonthOffset((o) => o + 1)}>
          <ChevronRight size={15} color="var(--text-2)" />
        </button>
      </div>

      {/* 月度汇总卡片（收据风格） */}
      <div style={{ background: 'var(--card-bg)', borderRadius: 16, overflow: 'hidden', marginBottom: 12, boxShadow: '0 2px 20px rgba(42,74,58,0.10)' }}>

        {/* 顶部渐变色条 */}
        <div style={{ height: 4, background: `linear-gradient(90deg, var(--green-l), var(--green), var(--green2))` }} />

        {/* 净收益主区域 */}
        <div style={{ padding: '18px 18px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>
            {baseMonth.format('YYYY年M月')} · 净收益
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1, color: summary.net >= 0 ? 'var(--green)' : 'var(--warm)', lineHeight: 1 }}>
            {summary.net >= 0 ? '+' : ''}¥{summary.net.toLocaleString()}
          </div>
        </div>

        {/* 虚线撕页线 */}
        <div style={{ position: 'relative', margin: '0 0', height: 1 }}>
          <div style={{ borderTop: '1.5px dashed var(--border)', margin: '0 16px' }} />
          {/* 两侧缺口 */}
          <div style={{ position: 'absolute', left: -8, top: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg)' }} />
          <div style={{ position: 'absolute', right: -8, top: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg)' }} />
        </div>

        {/* 收入 / 成本 两格 */}
        <div style={{ display: 'flex', padding: '12px 18px', gap: 12 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: 1, marginBottom: 4 }}>总收入</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>¥{summary.totalIncome.toLocaleString()}</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)', borderRadius: 1 }} />
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: 1, marginBottom: 4 }}>总成本</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-2)' }}>¥{summary.totalCost.toLocaleString()}</div>
          </div>
        </div>

        {/* 第二条虚线 */}
        <div style={{ position: 'relative', height: 1 }}>
          <div style={{ borderTop: '1.5px dashed var(--border)', margin: '0 16px' }} />
          <div style={{ position: 'absolute', left: -8, top: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg)' }} />
          <div style={{ position: 'absolute', right: -8, top: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg)' }} />
        </div>

        {/* 成本构成明细 */}
        <div style={{ padding: '10px 18px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: 1.5, marginBottom: 2 }}>成本构成</div>
          {[
            { label: `房租（${properties.length} 间）`, value: summary.totalRent },
            { label: '物业水电暖气',                    value: summary.totalUtility },
            { label: '维修采购',                        value: summary.totalMaintenance },
            { label: '保洁',                            value: summary.totalCleaning },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-3)' }}>{row.label}</span>
              <span style={{ fontWeight: 600, color: row.value > 0 ? 'var(--text-2)' : 'var(--text-3)' }}>
                {row.value > 0 ? `¥${row.value.toLocaleString()}` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

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
            <div style={{ height: 7, background: '#f0ece6', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${cur.rate}%`, background: p.coverColor, borderRadius: 4, minWidth: cur.rate > 0 ? 4 : 0, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-3)', marginBottom: 7 }}>已预订 {cur.booked} 天 / 共 {cur.days} 天</div>
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

      {/* 各房间明细 */}
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 }}>各房间明细</div>

      {propStats.map((p) => {
        const expanded = expandedIds.has(p.id)
        return (
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
              <button
                onClick={() => toggleExpand(p.id)}
                style={{ width: '100%', height: 34, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', borderRadius: 9, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? '收起明细' : '展开支出明细'}
                {p.exps.length > 0 && (
                  <span style={{ background: 'var(--green-l)', color: 'var(--green)', borderRadius: 999, padding: '0 6px', fontSize: 10, marginLeft: 2, fontWeight: 700 }}>
                    {p.exps.length}
                  </span>
                )}
              </button>
              {expanded && (
                <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
                    <span>房租（{monthStr}）</span>
                    <span style={{ fontWeight: 600 }}>¥{p.rent}</span>
                  </div>
                  {p.exps.length === 0 ? (
                    <div style={{ padding: '10px 0', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>本月无变动支出</div>
                  ) : p.exps.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13, color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>
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
        )
      })}

      {/* 导出按钮 */}
      <button
        onClick={handleExport}
        style={{ width: '100%', height: 50, marginTop: 4, borderRadius: 14, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 16px rgba(60,102,82,0.28)' }}
      >
        <Download size={16} />
        导出本月（{baseMonth.format('YYYY年M月')}）
      </button>
    </div>
  )
}
