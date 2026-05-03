import { useState, useEffect, useMemo } from 'react'
import { Button, Input, InputNumber, Modal, Select, message } from 'antd'
import dayjs from 'dayjs'
import { useStore } from '../store/useStore'
import type { Booking, BookingMode } from '../types'

let idCounter = Date.now()
const genId = () => `b${++idCounter}`

const lbl: React.CSSProperties = {
  fontSize: 15, color: '#595959', fontWeight: 500, marginBottom: 8, display: 'block',
}

// ── 自定义日期范围选择器 ───────────────────────────────────────
interface DRPProps {
  checkIn: string
  checkOut: string
  mode: BookingMode
  onChange: (ci: string, co: string) => void
  bookedDates?: Set<string>
}

function DateRangePicker({ checkIn, checkOut, mode, onChange, bookedDates }: DRPProps) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(
    checkIn ? dayjs(checkIn).startOf('month') : dayjs().startOf('month'),
  )
  const [tempIn, setTempIn] = useState(checkIn)
  const [tempOut, setTempOut] = useState(checkOut)
  const [stage, setStage] = useState<'in' | 'out'>('in')

  const openPicker = () => {
    setTempIn(checkIn)
    setTempOut(mode === 'monthly' ? '' : checkOut)
    setStage('in')
    setViewMonth(checkIn ? dayjs(checkIn).startOf('month') : dayjs().startOf('month'))
    setOpen(true)
  }

  const selectDay = (dateStr: string) => {
    if (mode === 'monthly') {
      // 包月：自动 +30 天后关闭
      const co = dayjs(dateStr).add(30, 'day').format('YYYY-MM-DD')
      onChange(dateStr, co)
      setOpen(false)
      return
    }
    if (stage === 'in') {
      setTempIn(dateStr)
      setTempOut('')
      setStage('out')
    } else {
      if (dateStr <= tempIn) {
        setTempIn(dateStr)
        setTempOut('')
      } else {
        setTempOut(dateStr)
      }
    }
  }

  const confirm = () => {
    if (tempIn && tempOut) {
      onChange(tempIn, tempOut)
      setOpen(false)
    }
  }

  // 生成日历格子（周一起始）
  const firstDow = viewMonth.day()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInM = viewMonth.daysInMonth()
  const cells = Array.from({ length: Math.ceil((offset + daysInM) / 7) * 7 }, (_, i) => {
    const n = i - offset + 1
    return n >= 1 && n <= daysInM ? viewMonth.date(n).format('YYYY-MM-DD') : null
  })

  const isStart  = (d: string) => d === tempIn
  const isEnd    = (d: string) => d === tempOut
  const inRange  = (d: string) => !!(tempIn && tempOut && d > tempIn && d < tempOut)
  const isToday  = (d: string) => d === dayjs().format('YYYY-MM-DD')
  const isBooked = (d: string) => bookedDates?.has(d) ?? false

  // 显示文本
  const co = mode === 'monthly' && checkIn
    ? dayjs(checkIn).add(30, 'day').format('YYYY-MM-DD')
    : checkOut
  const nights = checkIn && co ? dayjs(co).diff(dayjs(checkIn), 'day') : 0

  const WEEKS = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <>
      {/* 触发器 */}
      <div
        onClick={openPicker}
        style={{
          border: '1.5px solid #e8e8e8', borderRadius: 12, padding: '14px 16px',
          background: '#fff', cursor: 'pointer', minHeight: 52,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        {checkIn ? (
          <div style={{ fontSize: 17 }}>
            <span style={{ color: '#1677ff', fontWeight: 700 }}>
              {dayjs(checkIn).format('M月D日')}
            </span>
            <span style={{ color: '#8c8c8c', margin: '0 8px' }}>→</span>
            <span style={{ color: co ? '#1a1a1a' : '#bfbfbf', fontWeight: co ? 700 : 400 }}>
              {co ? dayjs(co).format('M月D日') : '退房日期'}
            </span>
            {nights > 0 && (
              <span style={{ color: '#8c8c8c', fontSize: 14, marginLeft: 8 }}>
                {nights} 晚{mode === 'monthly' ? '（包月）' : ''}
              </span>
            )}
          </div>
        ) : (
          <span style={{ color: '#bfbfbf', fontSize: 17 }}>请选择入住 / 退房日期</span>
        )}
        <span style={{ fontSize: 20, flexShrink: 0, marginLeft: 8 }}>📅</span>
      </div>

      {/* 底部弹出日历 */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div style={{
            width: '100%', maxWidth: 540, background: '#fff',
            borderRadius: '20px 20px 0 0', padding: '20px 16px',
            paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            maxHeight: '85vh', overflowY: 'auto',
          }}>
            {/* 标题栏 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>
                {mode === 'monthly'
                  ? '选择入住日期（包月 +30 天）'
                  : stage === 'in' ? '请选择入住日期' : '请选择退房日期'}
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', fontSize: 26,
                cursor: 'pointer', color: '#8c8c8c', padding: 0, lineHeight: 1,
              }}>×</button>
            </div>

            {/* 已选范围（按晚模式） */}
            {mode === 'nightly' && (
              <div style={{
                display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center',
                background: '#f5f5f5', borderRadius: 12, padding: '10px 14px',
              }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3 }}>入住</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: tempIn ? '#1677ff' : '#bfbfbf' }}>
                    {tempIn ? dayjs(tempIn).format('M/D') : '—'}
                  </div>
                </div>
                <div style={{ color: '#bfbfbf', fontSize: 18 }}>→</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 3 }}>退房</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: tempOut ? '#1a1a1a' : '#bfbfbf' }}>
                    {tempOut ? dayjs(tempOut).format('M/D') : '—'}
                  </div>
                </div>
                {tempIn && tempOut && (
                  <div style={{ fontSize: 14, color: '#52c41a', fontWeight: 700, flexShrink: 0 }}>
                    {dayjs(tempOut).diff(dayjs(tempIn), 'day')} 晚
                  </div>
                )}
              </div>
            )}

            {/* 月份导航 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <button onClick={() => setViewMonth((v) => v.subtract(1, 'month'))} style={{
                width: 38, height: 38, border: '1px solid #e8e8e8', borderRadius: 8,
                background: '#fff', fontSize: 20, cursor: 'pointer', color: '#595959',
              }}>‹</button>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{viewMonth.format('YYYY年M月')}</span>
              <button onClick={() => setViewMonth((v) => v.add(1, 'month'))} style={{
                width: 38, height: 38, border: '1px solid #e8e8e8', borderRadius: 8,
                background: '#fff', fontSize: 20, cursor: 'pointer', color: '#595959',
              }}>›</button>
            </div>

            {/* 星期标题 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
              {WEEKS.map((w) => (
                <div key={w} style={{ textAlign: 'center', fontSize: 13, color: '#8c8c8c', padding: '4px 0' }}>
                  {w}
                </div>
              ))}
            </div>

            {/* 日期格子 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {cells.map((d, idx) => {
                if (!d) return <div key={`e${idx}`} style={{ padding: '11px 0' }} />
                const start   = isStart(d)
                const end     = isEnd(d)
                const range   = inRange(d)
                const today   = isToday(d)
                const booked  = isBooked(d)
                const weekend = dayjs(d).day() === 0 || dayjs(d).day() === 6
                const freeColor = weekend ? '#E24B4A' : today ? '#1677ff' : '#1a1a1a'
                return (
                  <div
                    key={d}
                    onClick={() => { if (!booked) selectDay(d) }}
                    style={{
                      padding: '11px 2px', textAlign: 'center',
                      cursor: booked ? 'not-allowed' : 'pointer',
                      fontSize: 16, userSelect: 'none', position: 'relative',
                      borderRadius: booked ? 6 : start ? '8px 0 0 8px' : end ? '0 8px 8px 0' : 0,
                      background: booked
                        ? '#FCEBEB'
                        : start || end ? '#1677ff' : range ? '#bae0ff' : 'transparent',
                      color: booked
                        ? '#A32D2D'
                        : start || end ? '#fff' : freeColor,
                      fontWeight: start || end || today ? 700 : 400,
                    }}
                  >
                    {dayjs(d).date()}
                    {today && !start && !end && !booked && (
                      <div style={{
                        position: 'absolute', bottom: 3, left: '50%',
                        transform: 'translateX(-50%)',
                        width: 4, height: 4, borderRadius: '50%', background: '#1677ff',
                      }} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* 图例 */}
            {bookedDates && bookedDates.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: '#FCEBEB', border: '1.5px solid #E24B4A',
                }} />
                <span>已预订（不可选）</span>
              </div>
            )}

            {/* 确认按钮（仅按晚模式） */}
            {mode === 'nightly' && (
              <button
                onClick={confirm}
                disabled={!tempIn || !tempOut}
                style={{
                  width: '100%', height: 52, marginTop: 16, borderRadius: 12, border: 'none',
                  background: tempIn && tempOut ? '#1677ff' : '#e8e8e8',
                  color: tempIn && tempOut ? '#fff' : '#bfbfbf',
                  fontSize: 17, fontWeight: 700,
                  cursor: tempIn && tempOut ? 'pointer' : 'default',
                }}
              >
                {tempIn && tempOut
                  ? `确认（共 ${dayjs(tempOut).diff(dayjs(tempIn), 'day')} 晚）`
                  : '请选择完整日期范围'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── 主组件 ────────────────────────────────────────────────────
export default function AddBooking() {
  const { properties, bookings, addBooking } = useStore()
  const [bookingMode, setBookingMode] = useState<BookingMode>('nightly')
  const [propertyId, setPropertyId]   = useState<string>('')
  const [guestName, setGuestName]     = useState('')
  const [checkIn, setCheckIn]         = useState('')
  const [checkOut, setCheckOut]       = useState('')
  const [pricePerNight, setPricePerNight] = useState<number | null>(null)
  const [totalAmount, setTotalAmount] = useState<number | null>(null)
  const [notes, setNotes]             = useState('')
  const [loading, setLoading]         = useState(false)

  // 已预订日期集合（入住日到退房日前一天），用于日历灰显
  const bookedSet = useMemo(() => {
    const set = new Set<string>()
    if (!propertyId) return set
    bookings
      .filter((b) => b.propertyId === propertyId)
      .forEach((b) => {
        let cur = dayjs(b.checkIn)
        const co = dayjs(b.checkOut)
        while (cur.isBefore(co)) {
          set.add(cur.format('YYYY-MM-DD'))
          cur = cur.add(1, 'day')
        }
      })
    return set
  }, [bookings, propertyId])

  const effectiveCheckOut = bookingMode === 'monthly' && checkIn
    ? dayjs(checkIn).add(30, 'day').format('YYYY-MM-DD')
    : checkOut

  // 自动计算总金额
  useEffect(() => {
    if (!pricePerNight || pricePerNight <= 0 || !checkIn || !effectiveCheckOut) return
    const n = dayjs(effectiveCheckOut).diff(dayjs(checkIn), 'day')
    if (n > 0) setTotalAmount(Math.round(n * pricePerNight))
  }, [checkIn, effectiveCheckOut, pricePerNight])

  // 切换预订方式时重置日期
  const handleModeChange = (mode: BookingMode) => {
    setBookingMode(mode)
    setCheckOut('')
  }

  const handleDateChange = (ci: string, co: string) => {
    setCheckIn(ci)
    setCheckOut(co)
  }

  const handleSubmit = () => {
    if (!propertyId)          { message.warning('请选择房源');         return }
    if (!guestName.trim())    { message.warning('请输入客人姓名');      return }
    if (!checkIn)             { message.warning('请选择入住日期');      return }
    if (!effectiveCheckOut)   { message.warning('请选择退房日期');      return }
    if (!totalAmount || totalAmount <= 0) { message.warning('请输入总金额'); return }
    const nights = dayjs(effectiveCheckOut).diff(dayjs(checkIn), 'day')
    if (nights <= 0)          { message.warning('退房日期必须晚于入住日期'); return }

    const doAdd = () => {
      setLoading(true)
      const booking: Booking = {
        id: genId(), propertyId,
        guestName: guestName.trim(), guestPhone: '',
        checkIn, checkOut: effectiveCheckOut,
        totalAmount, paidAmount: totalAmount,
        paymentMethod: 'wechat', paymentStatus: 'paid',
        notes, createdAt: dayjs().format('YYYY-MM-DD'), bookingMode,
      }
      addBooking(booking)
      setPropertyId(''); setGuestName(''); setCheckIn(''); setCheckOut('')
      setPricePerNight(null); setTotalAmount(null); setNotes('')
      setLoading(false)
      message.success('预订已记录！')
    }

    // 冲突检测：同一房源时间段是否已有预订
    const conflicts = bookings.filter(
      (b) => b.propertyId === propertyId &&
        dayjs(b.checkIn).isBefore(effectiveCheckOut) &&
        dayjs(b.checkOut).isAfter(checkIn),
    )
    if (conflicts.length > 0) {
      const detail = conflicts
        .map((b) => `${b.guestName}（${dayjs(b.checkIn).format('M月D日')} → ${dayjs(b.checkOut).format('M月D日')}）`)
        .join('、')
      Modal.confirm({
        title: '房间时间冲突',
        content: `该房间在所选时段已有预订：${detail}。是否仍要继续新增？`,
        okText: '仍要新增', okType: 'danger', cancelText: '取消',
        onOk: doAdd,
      })
      return
    }

    doAdd()
  }

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 20 }}>新增预订</div>

      <div style={{ background: '#fff', borderRadius: 20, padding: '20px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

        {/* 按晚 / 包月 切换 */}
        <div style={{ marginBottom: 20 }}>
          <span style={lbl}>预订方式</span>
          <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 12, padding: 4 }}>
            {(['nightly', 'monthly'] as BookingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                style={{
                  flex: 1, height: 42, borderRadius: 9, border: 'none',
                  background: bookingMode === mode ? '#1677ff' : 'transparent',
                  color: bookingMode === mode ? '#fff' : '#595959',
                  fontSize: 17, cursor: 'pointer',
                  fontWeight: bookingMode === mode ? 700 : 400, transition: 'all 0.15s',
                }}
              >
                {mode === 'nightly' ? '按晚' : '包月（+30天）'}
              </button>
            ))}
          </div>
        </div>

        {/* 房源 */}
        <div style={{ marginBottom: 16 }}>
          <span style={lbl}>选择房源</span>
          <Select
            size="large" placeholder="点击选择房源" style={{ width: '100%' }}
            value={propertyId || undefined} onChange={setPropertyId}
            options={properties.map((p) => ({ label: p.name, value: p.id }))}
          />
        </div>

        {/* 客人姓名（必填） */}
        <div style={{ marginBottom: 16 }}>
          <span style={lbl}>
            客人姓名
            <span style={{ color: '#ff4d4f', marginLeft: 4, fontWeight: 700 }}>*</span>
          </span>
          <Input size="large" placeholder="请输入客人姓名（必填）"
            value={guestName} onChange={(e) => setGuestName(e.target.value)} />
        </div>

        {/* 日期范围选择器（统一组件，支持两种模式） */}
        <div style={{ marginBottom: 16 }}>
          <span style={lbl}>
            {bookingMode === 'nightly' ? '入住 / 退房日期' : '入住日期（退房自动 +30 天）'}
          </span>
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            mode={bookingMode}
            onChange={handleDateChange}
            bookedDates={bookedSet}
          />
          {/* 包月时显示计算出的退房日期 */}
          {bookingMode === 'monthly' && checkIn && (
            <div style={{
              marginTop: 8, padding: '10px 14px', background: '#f6f8fa',
              borderRadius: 10, fontSize: 15, color: '#595959',
            }}>
              退房日期（自动）：
              <span style={{ fontWeight: 700, color: '#1a1a1a', marginLeft: 6 }}>
                {dayjs(checkIn).add(30, 'day').format('M月D日')}
              </span>
            </div>
          )}
        </div>

        {/* 每晚单价（选填，用于自动计算） */}
        <div style={{ marginBottom: 16 }}>
          <span style={lbl}>每晚单价（选填，自动计算总金额）</span>
          <InputNumber
            size="large" placeholder="填写后自动计算总金额" style={{ width: '100%' }}
            prefix="¥" addonAfter="/ 晚" min={0} value={pricePerNight}
            onChange={(v) => setPricePerNight(v)}
          />
        </div>

        {/* 总金额 */}
        <div style={{ marginBottom: 16 }}>
          <span style={lbl}>总金额（元）</span>
          <InputNumber
            size="large" placeholder="请输入金额" style={{ width: '100%' }}
            prefix="¥" min={0} value={totalAmount}
            onChange={(v) => setTotalAmount(v)}
          />
        </div>

        {/* 备注 */}
        <div>
          <span style={lbl}>备注（选填）</span>
          <Input.TextArea
            rows={3} placeholder="客人特殊要求等..."
            value={notes} onChange={(e) => setNotes(e.target.value)}
            style={{ borderRadius: 12, fontSize: 17 }}
          />
        </div>
      </div>

      {/* 确认按钮 */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--tab-h) + env(safe-area-inset-bottom, 0px))',
        left: 0, right: 0, padding: '12px 16px', maxWidth: 540, margin: '0 auto',
      }}>
        <Button
          type="primary" block size="large" loading={loading} onClick={handleSubmit}
          style={{ height: 56, fontSize: 20, fontWeight: 700, borderRadius: 16, letterSpacing: 2 }}
        >
          确认预订
        </Button>
      </div>
    </div>
  )
}
