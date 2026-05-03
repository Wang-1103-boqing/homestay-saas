import { useState, useMemo } from 'react'
import { Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { useStore } from '../store/useStore'
import type { Booking, RentHistory } from '../types'

const EXP_TYPE_LABEL: Record<string, string> = {
  utility:     '物业水电暖气',
  maintenance: '维修采购',
  cleaning:    '保洁',
}

function numColor(v: number) {
  return v >= 0 ? '#52c41a' : '#ff4d4f'
}

// 按实际入住天数比例分摊某条预订在给定月份区间内的金额
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

export default function Revenue() {
  const { properties, bookings, expenses, rentHistory } = useStore()
  const [monthOffset, setMonthOffset] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const baseMonth = dayjs().add(monthOffset, 'month').startOf('month')
  const monthStr = baseMonth.format('YYYY-MM')
  const daysInMonth = baseMonth.daysInMonth()

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

  // 计算某房源在任意月份的入住率
  const calcOccupancy = (propId: string, month: dayjs.Dayjs) => {
    const mStart = month
    const days = month.daysInMonth()
    const mEnd = month.add(days, 'day')
    const relevant = bookings.filter(
      (b) => b.propertyId === propId &&
        dayjs(b.checkIn).isBefore(mEnd) &&
        dayjs(b.checkOut).isAfter(mStart),
    )
    let booked = 0
    relevant.forEach((b) => {
      const ci = dayjs(b.checkIn).isBefore(mStart) ? mStart : dayjs(b.checkIn)
      const co = dayjs(b.checkOut).isAfter(mEnd) ? mEnd : dayjs(b.checkOut)
      booked += co.diff(ci, 'day')
    })
    return { booked, days, rate: Math.min(100, Math.round((booked / days) * 100)) }
  }

  const prevMonth = baseMonth.subtract(1, 'month')

  const handleExport = () => {
    const mStart = baseMonth
    const mEnd = baseMonth.add(daysInMonth, 'day')
    const propMap = Object.fromEntries(properties.map((p) => [p.id, p.name]))

    // Sheet 1：当月预订记录（所有与本月重叠的预订）
    const overlapBookings = bookings.filter(
      (b) => dayjs(b.checkIn).isBefore(mEnd) && dayjs(b.checkOut).isAfter(mStart),
    )
    const bookingRows = overlapBookings.map((b) => {
      const totalDays = dayjs(b.checkOut).diff(dayjs(b.checkIn), 'day')
      const ci = dayjs(b.checkIn).isBefore(mStart) ? mStart : dayjs(b.checkIn)
      const co = dayjs(b.checkOut).isAfter(mEnd) ? mEnd : dayjs(b.checkOut)
      const daysThisMonth = co.diff(ci, 'day')
      const allocated = totalDays > 0 ? Math.round(b.totalAmount * daysThisMonth / totalDays) : 0
      return {
        '房源': propMap[b.propertyId] ?? b.propertyId,
        '客人姓名': b.guestName,
        '入住日期': b.checkIn,
        '退房日期': b.checkOut,
        '总晚数': totalDays,
        '本月入住天数': daysThisMonth,
        '总金额': b.totalAmount,
        '本月分摊金额': allocated,
        '预订方式': b.bookingMode === 'monthly' ? '包月' : '按晚',
        '备注': b.notes,
      }
    })

    // Sheet 2：当月支出记录
    const expRows = monthExpenses.map((e) => ({
      '房源': propMap[e.propertyId] ?? e.propertyId,
      '支出类型': EXP_TYPE_LABEL[e.type] ?? e.type,
      '日期': e.date,
      '金额': e.amount,
      '说明': e.description,
    }))

    // Sheet 3：当月收益汇总
    const summaryRows = [
      { '项目': '总收入（分摊）', '金额（元）': summary.totalIncome },
      { '项目': '房租', '金额（元）': summary.totalRent },
      { '项目': '物业水电暖气', '金额（元）': summary.totalUtility },
      { '项目': '维修采购', '金额（元）': summary.totalMaintenance },
      { '项目': '保洁', '金额（元）': summary.totalCleaning },
      { '项目': '总成本', '金额（元）': summary.totalCost },
      { '项目': '净收益', '金额（元）': summary.net },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bookingRows), '当月预订记录')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expRows), '当月支出记录')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), '当月收益汇总')
    XLSX.writeFile(wb, `民宿管家_${baseMonth.format('YYYY年M月')}.xlsx`)
  }

  // 汇总数据
  const summary = useMemo(() => {
    const mStart = baseMonth
    const mEnd = baseMonth.add(daysInMonth, 'day')
    const totalIncome = Math.round(
      bookings
        .filter((b) => dayjs(b.checkIn).isBefore(mEnd) && dayjs(b.checkOut).isAfter(mStart))
        .reduce((s, b) => s + proportionalIncome(b, mStart, mEnd), 0),
    )
    const totalRent = properties.reduce(
      (s, p) => s + getEffectiveRent(rentHistory, p.id, monthStr), 0,
    )
    const totalUtility = monthExpenses.filter((e) => e.type === 'utility').reduce((s, e) => s + e.amount, 0)
    const totalMaintenance = monthExpenses.filter((e) => e.type === 'maintenance').reduce((s, e) => s + e.amount, 0)
    const totalCleaning = monthExpenses.filter((e) => e.type === 'cleaning').reduce((s, e) => s + e.amount, 0)
    const totalCost = totalRent + totalUtility + totalMaintenance + totalCleaning
    return { totalIncome, totalRent, totalUtility, totalMaintenance, totalCleaning, totalCost, net: totalIncome - totalCost }
  }, [bookings, baseMonth, daysInMonth, monthExpenses, properties, rentHistory, monthStr])

  // 各房源明细
  const propStats = useMemo(() => {
    const mStart = baseMonth
    const mEnd = baseMonth.add(daysInMonth, 'day')
    return properties.map((p) => {
      const income = Math.round(
        bookings
          .filter((b) => b.propertyId === p.id && dayjs(b.checkIn).isBefore(mEnd) && dayjs(b.checkOut).isAfter(mStart))
          .reduce((s, b) => s + proportionalIncome(b, mStart, mEnd), 0),
      )
      const rent = getEffectiveRent(rentHistory, p.id, monthStr)
      const varExps = monthExpenses.filter((e) => e.propertyId === p.id)
      const varCost = varExps.reduce((s, e) => s + e.amount, 0)
      const cost = rent + varCost
      return { ...p, income, rent, varCost, cost, net: income - cost, exps: varExps }
    })
  }, [properties, bookings, baseMonth, daysInMonth, monthExpenses, rentHistory, monthStr])

  return (
    <div style={{ padding: '16px 16px 90px' }}>
      {/* 月份导航 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button shape="circle" icon={<LeftOutlined />} size="large" onClick={() => setMonthOffset((o) => o - 1)} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{baseMonth.format('YYYY年M月')}</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 2 }}>收益明细</div>
        </div>
        <Button shape="circle" icon={<RightOutlined />} size="large" onClick={() => setMonthOffset((o) => o + 1)} />
      </div>

      {/* 月度汇总卡片 */}
      <div style={{
        background: 'linear-gradient(135deg, #1677ff 0%, #0050b3 100%)',
        borderRadius: 24, padding: '24px 20px', marginBottom: 16, color: '#fff',
      }}>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 16 }}>本月总览</div>

        {/* 净收益大数字 */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 4 }}>本月净收益</div>
          <div style={{ fontSize: 42, fontWeight: 800, color: summary.net >= 0 ? '#95de64' : '#ff7875' }}>
            {summary.net >= 0 ? '+' : ''}¥{summary.net}
          </div>
        </div>

        {/* 收入 / 成本 两格 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: '总收入', value: summary.totalIncome, color: '#95de64' },
            { label: '总成本', value: summary.totalCost,  color: '#ff9c6e' },
          ].map((item) => (
            <div key={item.label} style={{
              flex: 1, background: 'rgba(255,255,255,0.12)',
              borderRadius: 14, padding: '12px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>¥{Math.abs(item.value)}</div>
            </div>
          ))}
        </div>

        {/* 成本分类明细 */}
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px' }}>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>成本构成</div>
          {[
            { label: `房租（${properties.length} 个房源）`, value: summary.totalRent },
            { label: '物业水电暖气',                        value: summary.totalUtility },
            { label: '维修采购',                            value: summary.totalMaintenance },
            { label: '保洁',                               value: summary.totalCleaning },
          ].map((row) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 14, opacity: 0.88, marginBottom: 5,
            }}>
              <span>{row.label}</span>
              <span style={{ fontWeight: row.value > 0 ? 700 : 400 }}>
                ¥{row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 入住率 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#595959', marginBottom: 10 }}>
          本月入住率
        </div>
        {properties.map((p) => {
          const cur  = calcOccupancy(p.id, baseMonth)
          const prev = calcOccupancy(p.id, prevMonth)
          const diff = cur.rate - prev.rate
          const trendColor = diff > 0 ? '#52c41a' : '#ff4d4f'
          const trendSymbol = diff > 0 ? '↑' : '↓'
          return (
            <div key={p.id} style={{
              background: '#fff', borderRadius: 14, padding: '12px 16px', marginBottom: 8,
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
            }}>
              {/* 本月行 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.coverColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {diff !== 0 && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: trendColor }}>{trendSymbol}{Math.abs(diff)}%</span>
                  )}
                  <span style={{ fontSize: 18, fontWeight: 800, color: p.coverColor }}>{cur.rate}%</span>
                </div>
              </div>
              <div style={{ height: 10, background: '#f0f0f0', borderRadius: 5, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{
                  height: '100%', borderRadius: 5,
                  width: `${cur.rate}%`, background: p.coverColor,
                  transition: 'width 0.4s ease',
                  minWidth: cur.rate > 0 ? 6 : 0,
                }} />
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 10 }}>
                已预订 {cur.booked} 天 / 共 {cur.days} 天
              </div>

              {/* 上月行 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#bfbfbf' }}>上月</span>
                <span style={{ fontSize: 13, color: '#bfbfbf' }}>{prev.rate}%</span>
              </div>
              <div style={{ height: 5, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${prev.rate}%`, background: '#d9d9d9',
                  transition: 'width 0.4s ease',
                  minWidth: prev.rate > 0 ? 4 : 0,
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 各房间明细 */}
      <div style={{ fontSize: 16, fontWeight: 600, color: '#595959', marginBottom: 12 }}>
        各房间明细
      </div>

      {propStats.map((p) => {
        const expanded = expandedIds.has(p.id)
        return (
          <div key={p.id} style={{
            background: '#fff', borderRadius: 20, marginBottom: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden',
          }}>
            <div style={{ height: 5, background: p.coverColor }} />
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{p.name}</div>

              {/* 三格数据 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {[
                  { label: '本月收入', value: p.income, color: '#52c41a' },
                  { label: '本月成本', value: p.cost,   color: '#fa8c16' },
                  { label: '净收益',   value: p.net,    color: numColor(p.net) },
                ].map((item) => (
                  <div key={item.label} style={{
                    flex: 1, background: '#f8f9fa', borderRadius: 12, padding: '10px 6px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>
                      {item.value < 0 ? '-' : ''}¥{Math.abs(item.value)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 10 }}>
                房租 ¥{p.rent} · 变动支出 ¥{p.varCost}
              </div>

              {/* 展开/收起 */}
              <button
                onClick={() => toggleExpand(p.id)}
                style={{
                  width: '100%', height: 38, border: '1px solid #e8e8e8',
                  background: expanded ? '#f0f5ff' : '#fafafa',
                  color: expanded ? '#1677ff' : '#8c8c8c',
                  borderRadius: 10, fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                {expanded ? '▲ 收起明细' : '▼ 展开支出明细'}
                {p.exps.length > 0 && (
                  <span style={{
                    background: expanded ? '#1677ff' : '#8c8c8c',
                    color: '#fff', borderRadius: 10, padding: '0 6px', fontSize: 12, marginLeft: 4,
                  }}>
                    {p.exps.length}
                  </span>
                )}
              </button>

              {expanded && (
                <div style={{ marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 0', fontSize: 15, color: '#595959', borderBottom: '1px solid #f5f5f5',
                  }}>
                    <span>📌 房租（{monthStr}）</span>
                    <span style={{ fontWeight: 600 }}>¥{p.rent}</span>
                  </div>
                  {p.exps.length === 0 ? (
                    <div style={{ padding: '12px 0', color: '#bfbfbf', fontSize: 14, textAlign: 'center' }}>
                      本月无变动支出
                    </div>
                  ) : (
                    p.exps.sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                      <div key={e.id} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '8px 0', fontSize: 15, color: '#595959', borderBottom: '1px solid #f5f5f5',
                      }}>
                        <div>
                          <span style={{
                            fontSize: 12, background: '#f0f0f0', color: '#595959',
                            padding: '1px 8px', borderRadius: 10, marginRight: 6,
                          }}>
                            {EXP_TYPE_LABEL[e.type] ?? e.type}
                          </span>
                          {e.description}
                          <div style={{ fontSize: 12, color: '#bfbfbf', marginTop: 2 }}>
                            {dayjs(e.date).format('M月D日')}
                          </div>
                        </div>
                        <span style={{ fontWeight: 600, color: '#ff4d4f', flexShrink: 0, marginLeft: 8 }}>
                          ¥{e.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* 导出按钮 */}
      <button
        onClick={handleExport}
        style={{
          width: '100%', height: 52, marginTop: 8, borderRadius: 14, border: 'none',
          background: '#1677ff', color: '#fff', fontSize: 17, fontWeight: 700,
          cursor: 'pointer', letterSpacing: 1,
        }}
      >
        导出本月（{baseMonth.format('YYYY年M月')}）
      </button>
    </div>
  )
}
