import { useState } from 'react'
import dayjs from 'dayjs'
import type { BookingMode } from '../types'

interface Props {
  checkIn: string
  checkOut: string
  mode: BookingMode
  onChange: (ci: string, co: string) => void
}

export default function DateRangePicker({ checkIn, checkOut, mode, onChange }: Props) {
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

  const firstDow = viewMonth.day()
  const offset = firstDow === 0 ? 6 : firstDow - 1
  const daysInM = viewMonth.daysInMonth()
  const cells = Array.from({ length: Math.ceil((offset + daysInM) / 7) * 7 }, (_, i) => {
    const n = i - offset + 1
    return n >= 1 && n <= daysInM ? viewMonth.date(n).format('YYYY-MM-DD') : null
  })

  const isStart = (d: string) => d === tempIn
  const isEnd   = (d: string) => d === tempOut
  const inRange = (d: string) => !!(tempIn && tempOut && d > tempIn && d < tempOut)
  const isToday = (d: string) => d === dayjs().format('YYYY-MM-DD')

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
          border: '1.5px solid #d9d9d9', borderRadius: 10, padding: '11px 14px',
          background: '#fff', cursor: 'pointer', minHeight: 44,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 15,
        }}
      >
        {checkIn ? (
          <div>
            <span style={{ color: '#1677ff', fontWeight: 700 }}>{dayjs(checkIn).format('M月D日')}</span>
            <span style={{ color: '#8c8c8c', margin: '0 6px' }}>→</span>
            <span style={{ color: co ? '#1a1a1a' : '#bfbfbf', fontWeight: co ? 700 : 400 }}>
              {co ? dayjs(co).format('M月D日') : '退房日期'}
            </span>
            {nights > 0 && (
              <span style={{ color: '#8c8c8c', fontSize: 13, marginLeft: 6 }}>{nights} 晚</span>
            )}
          </div>
        ) : (
          <span style={{ color: '#bfbfbf' }}>请选择入住 / 退房日期</span>
        )}
        <span style={{ fontSize: 18, marginLeft: 8 }}>📅</span>
      </div>

      {/* 底部弹出日历 */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 540, background: '#fff',
              borderRadius: '20px 20px 0 0', padding: '20px 16px',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
              maxHeight: '85vh', overflowY: 'auto',
            }}
          >
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
                <div key={w} style={{ textAlign: 'center', fontSize: 13, color: '#8c8c8c', padding: '4px 0' }}>{w}</div>
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
                const weekend = dayjs(d).day() === 0 || dayjs(d).day() === 6
                const freeColor = weekend ? '#E24B4A' : today ? '#1677ff' : '#1a1a1a'
                return (
                  <div
                    key={d}
                    onClick={() => selectDay(d)}
                    style={{
                      padding: '11px 2px', textAlign: 'center', cursor: 'pointer',
                      fontSize: 16, userSelect: 'none', position: 'relative',
                      borderRadius: start ? '8px 0 0 8px' : end ? '0 8px 8px 0' : 0,
                      background: start || end ? '#1677ff' : range ? '#bae0ff' : 'transparent',
                      color: start || end ? '#fff' : freeColor,
                      fontWeight: start || end || today ? 700 : 400,
                    }}
                  >
                    {dayjs(d).date()}
                    {today && !start && !end && (
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
