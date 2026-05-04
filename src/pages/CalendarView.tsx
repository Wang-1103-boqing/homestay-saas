import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import dayjs from 'dayjs'
import { useStore } from '../store/useStore'
import type { Booking } from '../types'
import DateRangePicker from '../components/DateRangePicker'

const ROW_H      = 26
const DATE_COL_W = 34
const MIN_COL_W  = 44

const NAV_BTN: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 7,
  background: 'var(--card-bg)', border: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', padding: 0,
}
const FIELD_BOX: React.CSSProperties = {
  border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px',
  fontSize: 15, width: '100%', boxSizing: 'border-box' as const,
  background: '#fff', fontFamily: 'inherit', outline: 'none', color: 'var(--text-1)',
}
const LBL: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-3)', display: 'block',
  marginBottom: 4, marginTop: 12, fontWeight: 600, letterSpacing: 0.5,
}

// ── BookingPopup ──────────────────────────────────────────────
function BookingPopup({
  booking, propColor, onClose, onSave,
}: {
  booking: Booking; propColor: string
  onClose: () => void; onSave: (updated: Booking) => void
}) {
  const [name, setName]         = useState(booking.guestName)
  const [checkIn, setCheckIn]   = useState(booking.checkIn)
  const [checkOut, setCheckOut] = useState(booking.checkOut)
  const [amount, setAmount]     = useState(String(booking.totalAmount))
  const [notes, setNotes]       = useState(booking.notes)
  const mode = booking.bookingMode ?? 'nightly'

  const handleSave = () => {
    if (!name.trim()) { alert('请输入客人姓名'); return }
    if (!checkIn || !checkOut) { alert('请选择日期'); return }
    if (dayjs(checkOut).diff(dayjs(checkIn), 'day') <= 0) { alert('退房日期必须晚于入住日期'); return }
    onSave({
      ...booking,
      guestName: name.trim(), checkIn, checkOut,
      totalAmount: Number(amount) || 0, paidAmount: Number(amount) || 0, notes,
    })
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

// ── RoomDetail ────────────────────────────────────────────────
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
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>
              {dayjs(b.checkIn).format('M月D日')} → {dayjs(b.checkOut).format('M月D日')}
              <span style={{ color: 'var(--text-3)', marginLeft: 8, fontSize: 12 }}>
                {nights(b.checkIn, b.checkOut)} 晚{b.bookingMode === 'monthly' ? '（包月）' : ''}
              </span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--green)' }}>¥{b.totalAmount}</div>
            {b.notes ? <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{b.notes}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 主甘特图视图 ──────────────────────────────────────────────
export default function CalendarView() {
  const { properties, bookings, updateBooking } = useStore()
  const [monthOffset, setMonthOffset]           = useState(0)
  const [selectedPropId, setSelectedPropId]     = useState<string | null>(null)
  const [popupBooking, setPopupBooking]         = useState<{ booking: Booking; color: string } | null>(null)

  const scrollRef  = useRef<HTMLDivElement>(null)
  const wrapRef    = useRef<HTMLDivElement>(null)
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

  // Scroll today to vertical center
  useEffect(() => {
    if (!scrollRef.current || todayIdx < 0) return
    const HEADER_H = 34
    const todayMidY = HEADER_H + todayIdx * ROW_H + ROW_H / 2
    scrollRef.current.scrollTop = Math.max(0, todayMidY - scrollRef.current.clientHeight / 2)
  }, [monthOffset, todayIdx])

  // Booking blocks per property column
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
