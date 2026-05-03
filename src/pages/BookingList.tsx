import { useState, useMemo } from 'react'
import { Modal, message } from 'antd'
import { DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useStore } from '../store/useStore'
import type { BookingMode } from '../types'
import DateRangePicker from '../components/DateRangePicker'

export default function BookingList() {
  const { properties, bookings, updateBooking, deleteBooking } = useStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  // edit form state
  const [fGuestName, setFGuestName] = useState('')
  const [fCheckIn, setFCheckIn] = useState('')
  const [fCheckOut, setFCheckOut] = useState('')
  const [fAmount, setFAmount] = useState('')
  const [fNotes, setFNotes] = useState('')
  const [fMode, setFMode] = useState<BookingMode>('nightly')

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
    updateBooking({
      ...b,
      guestName: fGuestName.trim(),
      checkIn: fCheckIn,
      checkOut: fCheckOut,
      totalAmount: amount,
      paidAmount: amount,
      paymentStatus: 'paid',
      notes: fNotes,
    })
    setEditingId(null)
    message.success('修改已保存')
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，确定删除这条预订记录？',
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: () => { deleteBooking(id); message.success('已删除') },
    })
  }

  const fieldBox: React.CSSProperties = {
    border: '1.5px solid #d9d9d9', borderRadius: 10, padding: '11px 14px',
    fontSize: 17, width: '100%', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 15, color: '#595959', fontWeight: 500,
    display: 'block', marginBottom: 6, marginTop: 14,
  }

  return (
    <div style={{ padding: '16px 16px 90px' }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        预订记录
        <span style={{ fontSize: 14, color: '#8c8c8c', fontWeight: 400, marginLeft: 8 }}>
          共 {sorted.length} 条
        </span>
      </div>

      {/* 搜索 + 月份筛选 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: '#fff', borderRadius: 12, padding: '10px 14px',
          border: '1.5px solid #e8e8e8',
        }}>
          <SearchOutlined style={{ color: '#bfbfbf', fontSize: 18, flexShrink: 0 }} />
          <input
            placeholder="搜索客人姓名..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              border: 'none', outline: 'none', fontSize: 16,
              width: '100%', background: 'transparent', color: '#1a1a1a',
            }}
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#bfbfbf', fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0,
              }}
            >×</button>
          )}
        </div>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          style={{
            height: 46, padding: '0 10px', borderRadius: 12,
            border: '1.5px solid #e8e8e8', background: '#fff',
            fontSize: 15, color: filterMonth ? '#1a1a1a' : '#bfbfbf',
            cursor: 'pointer', flexShrink: 0, outline: 'none',
          }}
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
        <div style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 17, paddingTop: 60 }}>
          {searchText || filterMonth ? '未找到匹配的预订记录' : '暂无预订记录'}
        </div>
      ) : (
        filtered.map((b) => {
          const prop = propMap[b.propertyId]
          const n = nights(b.checkIn, b.checkOut)
          return (
            <div key={b.id} style={{
              background: '#fff', borderRadius: 20, marginBottom: 12,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden',
            }}>
              {/* 彩色顶条 */}
              <div style={{ height: 5, background: prop?.coverColor ?? '#1677ff' }} />

              <div style={{ padding: '14px 16px' }}>
                {/* 房源标签 */}
                <div style={{ marginBottom: 8 }}>
                  <span style={{
                    fontSize: 13, color: '#8c8c8c',
                    background: '#f5f5f5', padding: '2px 10px', borderRadius: 20,
                  }}>
                    {prop?.name ?? b.propertyId}
                    {b.bookingMode === 'monthly' ? '（包月）' : ''}
                  </span>
                </div>

                {/* 客人名 */}
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>
                  {b.guestName}
                </div>

                {/* 日期 */}
                <div style={{ fontSize: 16, color: '#595959', marginBottom: 4 }}>
                  📅 {dayjs(b.checkIn).format('M月D日')} → {dayjs(b.checkOut).format('M月D日')}
                  <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: 14 }}>{n} 晚</span>
                </div>

                {/* 金额 */}
                <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a', marginBottom: 10 }}>
                  ¥{b.totalAmount}
                </div>

                {b.notes ? (
                  <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 10 }}>📝 {b.notes}</div>
                ) : null}

                {/* 操作 */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => openEdit(b)}
                    style={{
                      flex: 1, height: 44, border: '1.5px solid #1677ff',
                      background: '#fff', color: '#1677ff', borderRadius: 10,
                      fontSize: 16, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <EditOutlined />修改
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    style={{
                      width: 44, height: 44, border: '1.5px solid #ff4d4f',
                      background: '#fff', color: '#ff4d4f', borderRadius: 10,
                      fontSize: 18, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* 修改 Modal */}
      <Modal
        title="修改预订信息"
        open={!!editingId}
        onOk={handleSave}
        onCancel={() => setEditingId(null)}
        okText="保存" cancelText="取消" centered
      >
        <div>
          <label style={lbl}>客人姓名</label>
          <input
            style={fieldBox}
            value={fGuestName}
            onChange={(e) => setFGuestName(e.target.value)}
          />

          <label style={lbl}>入住 / 退房日期</label>
          <DateRangePicker
            checkIn={fCheckIn}
            checkOut={fCheckOut}
            mode={fMode}
            onChange={(ci, co) => { setFCheckIn(ci); setFCheckOut(co) }}
          />

          <label style={lbl}>金额（元）</label>
          <input
            type="number"
            style={fieldBox}
            value={fAmount}
            onChange={(e) => setFAmount(e.target.value)}
          />

          <label style={lbl}>备注</label>
          <textarea
            style={{ ...fieldBox, height: 72, resize: 'none' }}
            value={fNotes}
            onChange={(e) => setFNotes(e.target.value)}
            placeholder="特殊要求等..."
          />
        </div>
      </Modal>
    </div>
  )
}
