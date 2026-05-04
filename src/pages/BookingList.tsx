import { useState, useMemo } from 'react'
import { Modal, message } from 'antd'
import { Search, Edit2, Trash2, X } from 'lucide-react'
import dayjs from 'dayjs'
import { useStore } from '../store/useStore'
import type { BookingMode } from '../types'
import DateRangePicker from '../components/DateRangePicker'

export default function BookingList() {
  const { properties, bookings, updateBooking, deleteBooking } = useStore()
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  const [fGuestName, setFGuestName] = useState('')
  const [fCheckIn, setFCheckIn]     = useState('')
  const [fCheckOut, setFCheckOut]   = useState('')
  const [fAmount, setFAmount]       = useState('')
  const [fNotes, setFNotes]         = useState('')
  const [fMode, setFMode]           = useState<BookingMode>('nightly')

  const propMap = useMemo(() =>
    Object.fromEntries(properties.map((p) => [p.id, p])), [properties])

  const sorted = useMemo(() =>
    [...bookings].sort((a, b) => b.checkIn.localeCompare(a.checkIn)), [bookings])

  const availableMonths = useMemo(() => {
    const months = new Set(bookings.map((b) => b.checkIn.slice(0, 7)))
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [bookings])

  const filtered = useMemo(() => {
    let result = sorted
    if (filterMonth) result = result.filter((b) => b.checkIn.startsWith(filterMonth))
    if (searchText.trim()) result = result.filter((b) => b.guestName.includes(searchText.trim()))
    return result
  }, [sorted, filterMonth, searchText])

  const nights = (ci: string, co: string) => dayjs(co).diff(dayjs(ci), 'day')

  const openEdit = (b: (typeof bookings)[0]) => {
    setEditingId(b.id)
    setFGuestName(b.guestName)
    setFCheckIn(b.checkIn)
    setFCheckOut(b.checkOut)
    setFAmount(String(b.totalAmount))
    setFNotes(b.notes)
    setFMode(b.bookingMode ?? 'nightly')
  }

  const handleSave = () => {
    const b = bookings.find((x) => x.id === editingId)
    if (!b) return
    if (!fGuestName.trim()) { message.warning('请输入客人姓名'); return }
    if (!fCheckIn || !fCheckOut) { message.warning('请选择日期'); return }
    if (dayjs(fCheckOut).diff(dayjs(fCheckIn), 'day') <= 0) { message.warning('退房日期必须晚于入住日期'); return }
    const amount = Number(fAmount) || 0
    updateBooking({ ...b, guestName: fGuestName.trim(), checkIn: fCheckIn, checkOut: fCheckOut, totalAmount: amount, paidAmount: amount, paymentStatus: 'paid', notes: fNotes })
    setEditingId(null)
    message.success('修改已保存')
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除', content: '删除后无法恢复，确定删除这条预订记录？',
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: () => { deleteBooking(id); message.success('已删除') },
    })
  }

  const fieldBox: React.CSSProperties = {
    border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 14px',
    fontSize: 15, width: '100%', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', outline: 'none', color: 'var(--text-1)',
  }
  const lbl: React.CSSProperties = {
    fontSize: 12, color: 'var(--text-3)', fontWeight: 600,
    display: 'block', marginBottom: 5, marginTop: 12, letterSpacing: 0.5,
  }

  return (
    <div style={{ padding: '14px 14px 100px', background: 'var(--bg)', minHeight: '100%' }}>

      {/* 标题 */}
      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>
        预订记录
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400, marginLeft: 8 }}>
          共 {sorted.length} 条
        </span>
      </div>

      {/* 搜索 + 月份筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 7, background: 'var(--card-bg)', borderRadius: 12, padding: '9px 12px', border: '1px solid var(--border)' }}>
          <Search size={13} color="var(--text-3)" />
          <input
            placeholder="搜索客人姓名…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent', color: 'var(--text-1)', fontFamily: 'inherit' }}
          />
          {searchText && (
            <button onClick={() => setSearchText('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}>
              <X size={12} color="var(--text-3)" />
            </button>
          )}
        </div>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{ height: 40, padding: '0 10px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card-bg)', fontSize: 12, color: filterMonth ? 'var(--text-1)' : 'var(--text-3)', cursor: 'pointer', flexShrink: 0, outline: 'none' }}
        >
          <option value="">全部月份</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m.replace('-', '年').replace(/^(\d+年)(\d+)$/, (_, y, mo) => `${y}${parseInt(mo)}月`)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 15, paddingTop: 60 }}>
          {searchText || filterMonth ? '未找到匹配的预订记录' : '暂无预订记录'}
        </div>
      ) : filtered.map((b) => {
        const prop = propMap[b.propertyId]
        const n = nights(b.checkIn, b.checkOut)
        return (
          <div key={b.id} style={{ background: 'var(--card-bg)', borderRadius: 14, marginBottom: 10, boxShadow: '0 2px 16px rgba(42,74,58,0.08)', overflow: 'hidden' }}>
            {/* 房间色条 */}
            <div style={{ height: 3, background: prop?.coverColor ?? 'var(--green)' }} />

            <div style={{ padding: '12px 14px' }}>
              {/* 顶行：客人名 + 金额 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{b.guestName}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {prop?.name ?? b.propertyId} · {n} 晚{b.bookingMode === 'monthly' ? '（包月）' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>¥{b.totalAmount}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    {dayjs(b.checkIn).format('M/D')}—{dayjs(b.checkOut).format('M/D')}
                  </div>
                </div>
              </div>

              {b.notes ? <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8 }}>{b.notes}</div> : null}

              {/* 底部：状态 + 操作 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 999, fontWeight: 600, background: 'var(--green-l)', color: 'var(--green)' }}>已确认</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => openEdit(b)}
                    style={{ height: 32, padding: '0 14px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-2)', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Edit2 size={11} />修改
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{ width: 32, height: 32, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-3)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* 修改 Modal */}
      <Modal title="修改预订信息" open={!!editingId} onOk={handleSave} onCancel={() => setEditingId(null)} okText="保存" cancelText="取消" centered>
        <div>
          <label style={lbl}>客人姓名</label>
          <input style={fieldBox} value={fGuestName} onChange={(e) => setFGuestName(e.target.value)} />
          <label style={lbl}>入住 / 退房日期</label>
          <DateRangePicker checkIn={fCheckIn} checkOut={fCheckOut} mode={fMode} onChange={(ci, co) => { setFCheckIn(ci); setFCheckOut(co) }} />
          <label style={lbl}>金额（元）</label>
          <input type="number" style={fieldBox} value={fAmount} onChange={(e) => setFAmount(e.target.value)} />
          <label style={lbl}>备注</label>
          <textarea style={{ ...fieldBox, height: 72, resize: 'none' }} value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="特殊要求等..." />
        </div>
      </Modal>
    </div>
  )
}
