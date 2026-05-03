import { useState, useMemo, useRef, useLayoutEffect } from 'react'
import { Button, message } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useStore } from '../store/useStore'
import type { Booking } from '../types'
import DateRangePicker from '../components/DateRangePicker'

// ── 甘特图算法 ────────────────────────────────────────────────
type CellPlan =
  | { type: 'empty' }
  | { type: 'skip' }
  | { type: 'booking'; booking: Booking; rowspan: number }

function buildGanttPlan(
  propId: string,
  allBookings: Booking[],
  baseMonth: dayjs.Dayjs,
  daysInMonth: number,
): CellPlan[] {
  const mStart = baseMonth
  const mEnd = baseMonth.add(daysInMonth, 'day')

  const relevant = allBookings.filter(
    (b) => b.propertyId === propId && dayjs(b.checkIn).isBefore(mEnd) && dayjs(b.checkOut).isAfter(mStart),
  )

  const dayOwner: (Booking | null)[] = [null, ...new Array(daysInMonth).fill(null)]

  relevant.forEach((b) => {
    const ci = dayjs(b.checkIn)
    const co = dayjs(b.checkOut)
    const startDay = ci.isBefore(mStart) ? 1 : ci.date()
    const lastDay = co.isAfter(mEnd.subtract(1, 'day')) ? daysInMonth : co.date() - 1
    for (let d = startDay; d <= lastDay; d++) dayOwner[d] = b
  })

  const plan: CellPlan[] = [{ type: 'empty' }]
  const consumed = new Set<number>()

  for (let d = 1; d <= daysInMonth; d++) {
    if (consumed.has(d)) { plan.push({ type: 'skip' }); continue }
    const b = dayOwner[d]
    if (!b) { plan.push({ type: 'empty' }); continue }
    const co = dayjs(b.checkOut)
    const lastOccupied = co.isAfter(mEnd.subtract(1, 'day')) ? daysInMonth : co.date() - 1
    const rowspan = lastOccupied - d + 1
    for (let dd = d + 1; dd <= lastOccupied; dd++) consumed.add(dd)
    plan.push({ type: 'booking', booking: b, rowspan })
  }

  return plan
}

// ── 房间月历详情页 ─────────────────────────────────────────────
function RoomDetail({
  propId,
  baseMonth,
  onBack,
}: {
  propId: string
  baseMonth: dayjs.Dayjs
  onBack: () => void
}) {
  const { properties, bookings } = useStore()
  const prop = properties.find((p) => p.id === propId)
  const monthStr = baseMonth.format('YYYY-MM')

  const monthBookings = bookings
    .filter((b) => b.propertyId === propId && b.checkIn.startsWith(monthStr))
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))

  const nights = (ci: string, co: string) => dayjs(co).diff(dayjs(ci), 'day')

  return (
    <div style={{ padding: '0 0 90px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: '#fff', borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: 10, border: '1.5px solid #e8e8e8',
          background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LeftOutlined style={{ fontSize: 16 }} />
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{prop?.name}</div>
          <div style={{ fontSize: 13, color: '#8c8c8c' }}>{baseMonth.format('YYYY年M月')} 入住详情</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {monthBookings.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 17, paddingTop: 60 }}>
            本月暂无预订
          </div>
        ) : (
          monthBookings.map((b) => (
            <div key={b.id} style={{
              background: '#fff', borderRadius: 16, padding: '16px 18px', marginBottom: 12,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{b.guestName}</div>
              <div style={{ fontSize: 16, color: '#595959', marginBottom: 4 }}>
                {dayjs(b.checkIn).format('M月D日')} → {dayjs(b.checkOut).format('M月D日')}
                <span style={{ color: '#8c8c8c', marginLeft: 8, fontSize: 14 }}>
                  {nights(b.checkIn, b.checkOut)} 晚
                  {b.bookingMode === 'monthly' ? '（包月）' : ''}
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }}>¥{b.totalAmount}</div>
              {b.notes ? <div style={{ fontSize: 14, color: '#8c8c8c', marginTop: 6 }}>📝 {b.notes}</div> : null}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ── 预订详情弹窗 ───────────────────────────────────────────────
function BookingPopup({
  booking,
  propColor,
  onClose,
  onSave,
}: {
  booking: Booking
  propColor: string
  onClose: () => void
  onSave: (updated: Booking) => void
}) {
  const [name, setName] = useState(booking.guestName)
  const [checkIn, setCheckIn] = useState(booking.checkIn)
  const [checkOut, setCheckOut] = useState(booking.checkOut)
  const [amount, setAmount] = useState(String(booking.totalAmount))
  const [notes, setNotes] = useState(booking.notes)
  const mode = booking.bookingMode ?? 'nightly'

  const handleSave = () => {
    if (!name.trim()) { message.warning('请输入客人姓名'); return }
    if (!checkIn || !checkOut) { message.warning('请选择日期'); return }
    if (dayjs(checkOut).diff(dayjs(checkIn), 'day') <= 0) { message.warning('退房日期必须晚于入住日期'); return }
    onSave({ ...booking, guestName: name.trim(), checkIn, checkOut, totalAmount: Number(amount) || 0, paidAmount: Number(amount) || 0, notes })
    message.success('修改已保存')
    onClose()
  }

  const fieldBox: React.CSSProperties = {
    border: '1.5px solid #d9d9d9', borderRadius: 10, padding: '10px 12px',
    fontSize: 16, width: '100%', boxSizing: 'border-box', background: '#fff',
  }
  const lbl: React.CSSProperties = { fontSize: 13, color: '#8c8c8c', display: 'block', marginBottom: 4, marginTop: 12 }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 540, background: '#fff',
        borderRadius: '20px 20px 0 0', padding: '0 0 calc(20px + env(safe-area-inset-bottom, 0px))',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* 顶部彩色条 */}
        <div style={{ height: 6, background: propColor, borderRadius: '20px 20px 0 0' }} />

        <div style={{ padding: '16px 16px 0' }}>
          {/* 标题栏 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>预订详情</div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', fontSize: 26,
              cursor: 'pointer', color: '#8c8c8c', padding: 0, lineHeight: 1,
            }}>×</button>
          </div>

          <label style={lbl}>客人姓名</label>
          <input style={fieldBox} value={name} onChange={(e) => setName(e.target.value)} />

          <label style={lbl}>入住 / 退房日期</label>
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            mode={mode}
            onChange={(ci, co) => { setCheckIn(ci); setCheckOut(co) }}
          />

          <label style={lbl}>金额（元）</label>
          <input type="number" style={fieldBox} value={amount} onChange={(e) => setAmount(e.target.value)} />

          <label style={lbl}>备注</label>
          <textarea
            style={{ ...fieldBox, height: 64, resize: 'none' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="无备注"
          />

          <button
            onClick={handleSave}
            style={{
              width: '100%', height: 50, marginTop: 16, borderRadius: 12, border: 'none',
              background: propColor, color: '#fff', fontSize: 17, fontWeight: 700, cursor: 'pointer',
            }}
          >
            保存修改
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 主甘特图视图 ───────────────────────────────────────────────
export default function CalendarView() {
  const { properties, bookings, updateBooking } = useStore()
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedPropId, setSelectedPropId] = useState<string | null>(null)
  const [popupBooking, setPopupBooking] = useState<{ booking: Booking; color: string } | null>(null)

  const baseMonth = dayjs().add(monthOffset, 'month').startOf('month')
  const daysInMonth = baseMonth.daysInMonth()
  const todayStr = dayjs().format('YYYY-MM-DD')

  const ROW_H = 38
  const DATE_COL_W = 34
  const ROOM_COL_W = Math.max(72, Math.floor((340 - DATE_COL_W) / Math.max(properties.length, 1)))

  // ── 今日横线：用 ref 量出 thead 高度后绝对定位 ────────────────
  const theadRef = useRef<HTMLTableSectionElement>(null)
  const [theadH, setTheadH] = useState(40)

  // 每次 properties 数量变化时重测（房间名可能使 th 换行）
  useLayoutEffect(() => {
    if (theadRef.current) setTheadH(theadRef.current.offsetHeight)
  }, [properties.length])

  const todayInMonth = dayjs().format('YYYY-MM') === baseMonth.format('YYYY-MM')
  const todayDay = todayInMonth ? dayjs().date() : null
  // 线垂直居中于今日行
  const lineY = todayDay !== null ? theadH + (todayDay - 1) * ROW_H + ROW_H / 2 : null

  const ganttPlans = useMemo(() => {
    const plans: Record<string, CellPlan[]> = {}
    properties.forEach((p) => {
      plans[p.id] = buildGanttPlan(p.id, bookings, baseMonth, daysInMonth)
    })
    return plans
  }, [properties, bookings, baseMonth, daysInMonth])

  if (selectedPropId) {
    return (
      <RoomDetail
        propId={selectedPropId}
        baseMonth={baseMonth}
        onBack={() => setSelectedPropId(null)}
      />
    )
  }

  const dayOfWeek = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div style={{ padding: '16px 0 90px' }}>
      {/* 月份导航 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', marginBottom: 16,
      }}>
        <Button shape="circle" icon={<LeftOutlined />} size="large" onClick={() => setMonthOffset((o) => o - 1)} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{baseMonth.format('YYYY年M月')}</div>
          <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 2 }}>点击房间名查看详情</div>
        </div>
        <Button shape="circle" icon={<RightOutlined />} size="large" onClick={() => setMonthOffset((o) => o + 1)} />
      </div>

      {/*
        外层 position:relative 作为绝对定位锚点。
        今日横线放在 overflowX:auto 之外，所以它始终横穿全宽，
        不会随表格水平滚动而截断，也能覆盖 rowspan 预订色块。
      */}
      <div style={{ position: 'relative' }}>
        <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
          <table style={{
            borderCollapse: 'collapse',
            minWidth: DATE_COL_W + properties.length * ROOM_COL_W,
            width: '100%',
          }}>
            <thead ref={theadRef}>
              <tr>
                <th style={{
                  width: DATE_COL_W, minWidth: DATE_COL_W,
                  position: 'sticky', top: 0, left: 0,
                  background: '#fafafa', zIndex: 20,
                  border: '1px solid #f0f0f0',
                  fontSize: 12, color: '#8c8c8c', fontWeight: 500,
                  padding: 4,
                }}>
                  日期
                </th>
                {properties.map((p) => (
                  <th
                    key={p.id}
                    onClick={() => setSelectedPropId(p.id)}
                    style={{
                      width: ROOM_COL_W, minWidth: ROOM_COL_W,
                      position: 'sticky', top: 0,
                      background: p.coverColor, zIndex: 10,
                      border: '1px solid rgba(255,255,255,0.3)',
                      fontSize: 13, color: '#fff', fontWeight: 700,
                      padding: '8px 4px', cursor: 'pointer',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1
                const dateStr = baseMonth.date(d).format('YYYY-MM-DD')
                const dow = baseMonth.date(d).day()
                const isToday = dateStr === todayStr
                const isWeekend = dow === 0 || dow === 6

                return (
                  <tr key={d} style={{ height: ROW_H }}>
                    {/* 日期单元格 */}
                    <td style={{
                      position: 'sticky', left: 0, zIndex: 5,
                      background: isToday ? '#fff1f0' : '#fafafa',
                      border: '1px solid #f0f0f0',
                      textAlign: 'center', padding: 0,
                      width: DATE_COL_W, minWidth: DATE_COL_W,
                    }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: isToday ? 800 : 400,
                        color: isToday ? '#ff4d4f' : isWeekend ? '#ff4d4f' : '#595959',
                      }}>
                        {d}
                      </div>
                      <div style={{ fontSize: 10, color: isToday ? '#ff4d4f' : '#bfbfbf', lineHeight: 1 }}>
                        {dayOfWeek[dow]}
                      </div>
                    </td>

                    {/* 各房间单元格 */}
                    {properties.map((p) => {
                      const cell = ganttPlans[p.id]?.[d]
                      if (!cell || cell.type === 'skip') return null
                      if (cell.type === 'empty') {
                        return (
                          <td key={p.id} style={{
                            border: '1px solid #f0f0f0',
                            background: '#fff',
                            width: ROOM_COL_W,
                          }} />
                        )
                      }
                      const { booking, rowspan } = cell
                      return (
                        <td
                          key={p.id}
                          rowSpan={rowspan}
                          onClick={() => setPopupBooking({ booking, color: p.coverColor })}
                          style={{
                            background: p.coverColor,
                            border: '2px solid #fff',
                            borderRadius: 6,
                            verticalAlign: 'top',
                            padding: '4px 3px',
                            width: ROOM_COL_W,
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{
                            color: '#fff',
                            fontSize: rowspan === 1 ? 11 : 13,
                            fontWeight: 700,
                            lineHeight: 1.3,
                            wordBreak: 'break-all',
                            maxHeight: rowspan * ROW_H - 8,
                            overflow: 'hidden',
                          }}>
                            {booking.guestName}
                            {booking.bookingMode === 'monthly' && (
                              <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>包月</div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 今日红色横线 — 绝对定位，完整横穿日历区域（含预订色块） */}
        {lineY !== null && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: lineY - 1,          // 垂直居中于当日行
              left: 0,
              right: 0,
              height: 3,
              background: '#ff4d4f',
              zIndex: 40,              // 高于 sticky th (z:20) 和 sticky td (z:5)
              pointerEvents: 'none',
              boxShadow: '0 0 8px rgba(255,77,79,0.55)',  // 红色晕染，更醒目
            }}
          />
        )}
      </div>

      {/* 预订详情弹窗 */}
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
